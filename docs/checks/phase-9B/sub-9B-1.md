# Check: sub-9B-1 — Frontier backend (seed pool + unrecorded gate)

**Date:** 2026-07-10
**Branch:** main
**Verdict:** PASS

---

## Scope

The backend for a real solo hunt of stars with **no KOI entry** (honesty nail #3).
`koi_catalog.csv` only lists stars that *are* KOIs, so it is an exclusion set — it
cannot answer "pick an unrecorded KIC." A pre-verified **seed pool** solves this:

- `scripts/build_frontier_seeds.py` — offline one-time builder (MAST probe).
- `backend/data/frontier_seeds.json` — committed pool (50 unrecorded KICs).
- `services/hunt.py` — `koi_entries` / `is_recorded` / `pick_frontier`.
- `models/hunt.py` — `FrontierPick`, `RecordedCheck`, `RecordedEntry`.
- `routers/hunt.py` — `GET /hunt/frontier/random`, `GET /hunt/recorded/{kic_id}`.
- `tests/test_hunt.py` (8) + `tests/test_hunt_api.py` (3).

No new vetting logic — the hunt reuses the 9-A `lc → bls → vet` contract unchanged.

---

## Tests (`pytest`)

```
28 passed in 0.76s
```

- Service (8): `koi_entries`/`is_recorded` period-independent membership; the **pool
  invariant** (every seeded KIC `is_recorded == False`); pool JSON shape (unique,
  sorted, positive ints); `pick_frontier` deterministic with an injected RNG.
- HTTP contract (3): TestClient over the two endpoints — status, response shape,
  `/api` prefix.

---

## Seed pool build

```
python scripts/build_frontier_seeds.py --n 50 --max-candidates 3000 --seed 9
→ wrote 50 seeds (1200 probed, 40s)
```

Candidates are sampled near KOI anchors (KIC-number neighbours share a Kepler field,
lifting the "has data" hit rate above blind random) and kept only if **absent from
koi_catalog AND a Kepler light curve exists**. Probing is **batched**: one MAST
`query_criteria` per 100 candidates by `kplr%09d` target_name, so non-existent KICs
cost nothing (no per-target sky-position resolver timeout). Hit rate ~4%, but batching
made that irrelevant to wall time — **40 s vs the ~30–40 min a per-target loop took**.

Pool verified: 50 KICs, unique, sorted, range 2,557,393–12,110,905, **every entry
`is_recorded == False`**. Spot-check KIC 2,557,393 resolves via lightkurve (1 result),
confirming the runtime fetch path agrees with the build-time MAST probe.

---

## Endpoints

```
GET /api/hunt/frontier/random → 200  {"kic_id": 6195632, "recorded": false}
GET /api/hunt/recorded/11446443 → 200
    {"kic_id":11446443,"recorded":true,"entries":[{"kepoi_name":"K00001.01","disposition":"CONFIRMED"}]}
GET /api/hunt/recorded/1 → 200  {"kic_id":1,"recorded":false,"entries":[]}
```

**Success criteria (issue #42): all met.**
- Every KIC in the pool has `is_recorded == False` (invariant enforced by test) ✅
- Known KOI (KIC 11446443) → `/hunt/recorded` returns `recorded: true` + entries ✅
- `/hunt/frontier/random` returns a pool KIC, always unrecorded ✅
- `pytest` passes ✅

---

## Findings

- **Batched MAST query is the fix for the slow builder.** The v1 builder resolved
  each `"KIC n"` by name; a non-existent neighbour KIC triggered a slow sky-position
  resolver timeout, so a 50-seed build was projected at 30–40 min. Querying MAST once
  per batch by `kplr%09d` target_name returns rows only for targets that actually have
  timeseries — absent KICs never enter name resolution. Same result, ~50× faster.
- **`is_recorded` is deliberately period-independent.** It answers "does this star
  have *any* KOI entry?" (membership by kepid), distinct from `koi_check`, which
  matches a period harmonic. Conservative on purpose: any KOI entry ⇒ not hunting
  ground. This is what makes the frontier pool honest — the invariant test would fail
  if a seeded star turned out to carry a KOI.

---

## Result

The frontier pool is built, committed, and proven unrecorded; the two endpoints serve
an unrecorded target and a period-independent recorded check. The honest hunting
ground of Phase 9-B (nail #3) now exists as data + tests. Sub-9B-1 backend is complete.
The frontend real-hunt page is sub-9B-2.
