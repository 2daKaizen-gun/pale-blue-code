## Plan

sub-10-4 makes the frontier hunt **inviting and honest at once** by moving the
novelty from *space* to *time*. Picking a bare star number (KIC/TIC) is
expert-only, and a blind random button has no context. The deeper worry: showing
already-confirmed planets is not a real hunt. The honest answer — the Kepler
archive is fully picked over by professionals, so the one genuine gap left to an
amateur is **the newest TESS sector**: a fresh slice of sky released roughly every
~27 days, holding stars that are not yet in the TOI catalog. Their starlight
arrived at TESS weeks ago and nobody has looked. That is the frontier.

So the frontier pool becomes **the freshest sky we can serve**, presented two ways:
a recency-sorted **feed** ("갓 내린 하늘") the hunter can browse by real identity —
constellation, brightness, sun-likeness, days-since-observed — and a **first-look
reveal** when a star is picked. The pool always tracks the *newest* SPOC sector
(auto-detected, never hardcoded) and is refreshed on a schedule.

## Lights (proposed)

- [ ] Light 1 (Part A) — builder v2: `build_frontier_seeds_tess.py` auto-detects the
  newest SPOC sector (probe downward from a date estimate), keeps only TICs absent
  from `toi_catalog.csv`, and enriches each with human-readable identity. Emits
  schema `@2` and regenerates `backend/data/frontier_seeds_tess.json` for real.
- [ ] Light 2 (Part B) — backend: read `@2`, a `FrontierStar` model, `frontier/random`
  returns an enriched pick, and a new **`frontier/pool`** feed endpoint (freshness +
  recency-sorted stars). `pytest` green.
- [ ] Light 3 (Part C1) — frontend feed "갓 내린 하늘": a recency-sorted card list
  (sector, N days since observed, constellation, brightness, sun-like), plus a
  freshness / last-updated line. Browse a *place in the sky*, not a bare number.
- [ ] Light 4 (Part C2) — first-look reveal + TESS wiring: picking a star plays a
  "first look" reveal, then runs the existing lc → bls → vet flow (mission=tess).
- [ ] Light 5 (Part D) — schedule: a biweekly routine reruns the builder and, if the
  newest sector changed, rebuilds + commits + pushes the pool. Skips when unchanged.
- [ ] Light 6 — Check doc `docs/checks/phase-10/sub-10-4.md` recording the live run.

## Success criteria

- [ ] The pool is drawn from the newest SPOC sector MAST serves, detected at build
  time (no hardcoded sector); schema `@2` carries per-star identity + freshness.
- [ ] `/hunt/frontier/pool` returns a recency-sorted feed with freshness metadata;
  `/hunt/frontier/random` returns an enriched pick. `pytest` green.
- [ ] The frontier TESS page shows a browsable feed of real stars (constellation /
  brightness / days-ago) and a first-look reveal on pick; `npm run build` green.
- [ ] Enrichment is strictly *stellar* (brightness, temperature, distance,
  constellation) — never *planetary* — so it never leaks the answer (honesty nail #3).
- [ ] A scheduled routine keeps the pool tracking the newest sector.

## Key decisions / invariants

- **Always newest sector, auto-detected** — never hardcode a sector number.
- **Novelty in time, not confirmed planets** — the hook is fact + "nobody has looked
  at this star yet." No over-claiming; enrichment must not hint at a planet.
- **Frontier separation invariant** still holds: `/hunt/frontier*` is not in
  `phases.ts`.
- Reuse the lc → bls → vet contract and `VettingReportCard` verbatim.

## References

- PRD/TechSpec: `docs/specs/phase-10/`
- Prior: sub-10-1 (#45), sub-10-2 (#46), sub-10-3 (#47)
- Milestone: Phase 10 — Skyward (#11)
