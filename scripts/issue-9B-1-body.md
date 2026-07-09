## Plan

Build the backend for a real solo hunt of stars with no KOI entry (honesty nail
#3). `koi_catalog.csv` only lists stars that *are* KOIs, so it works as an
exclusion set but cannot answer "pick an unrecorded KIC." A pre-verified **seed
pool** solves this: an offline one-time script probes Kepler KIC candidates and
keeps only those that (1) are absent from the KOI catalog and (2) have a real
Kepler long-cadence light curve. At runtime we only read a local JSON — instant,
deterministic, testable, honest. Vetting itself is reused unchanged from 9-A.

## Lights

- [ ] `scripts/build_frontier_seeds.py` — offline seed-pool builder (lightkurve probe)
- [ ] `backend/data/frontier_seeds.json` — committed pool (~50-200 unrecorded KICs)
- [ ] `services/hunt.py` + tests — `koi_entries` / `is_recorded` / `pick_frontier`
- [ ] `routers/hunt.py` — `GET /hunt/frontier/random` + `GET /hunt/recorded/{kic_id}`

## Success criteria

- [ ] Every KIC in the pool has `is_recorded == False` (invariant enforced by test)
- [ ] A known KOI (KIC 11446443) → `/hunt/recorded` returns `recorded: true` + entries
- [ ] `/hunt/frontier/random` returns a pool KIC that is always unrecorded
- [ ] `pytest` passes

## Key decisions

- Seed pool over live blind probing: network cost is paid offline once; runtime
  reads local JSON. Deterministic and unit-testable.
- `is_recorded` checks kepid membership regardless of period (distinct from
  `koi_check`, which matches a period harmonic). Conservative "any KOI entry =
  recorded" verdict.
- No new vetting logic — 9-B wraps `vetting.vet` from 9-A. Reuse the existing
  `/hunt/lc` -> `/hunt/bls` -> `/hunt/vet` contract.

## References

- PRD: `docs/specs/phase-9B/PRD.md`
- TechSpec: `docs/specs/phase-9B/TECHSPEC.md`
- Prior movement handoff: `docs/phase-handoffs/phase-9-to-9B.md`
