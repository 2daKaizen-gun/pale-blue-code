## Plan

sub-10-1 builds the TESS backend for the frontier hunt: fetch a TESS light
curve by TIC, gate stars by TOI membership (the recorded check), wire the
mission through the vetter and the hunt routes without changing any gate math,
and build a pre-verified pool of unrecorded TICs offline. The four-gate vetter
is reused unchanged — only the star's name (KIC vs TIC) and the light-curve
source differ. BLS is already mission-agnostic, so the mission simply flows
from the cached light curve's `mission` field.

## Lights

- [ ] Light 1 — TOI recorded-gate: add `data/toi_catalog.csv` + `hunt.toi_entries` / `hunt.is_recorded_tess` (TIC membership by `tid`), pytest.
- [ ] Light 2 — `fetch_lc_by_tic`: TESS light-curve fetch (`mission="TESS"`, `exptime="long"`), cached as `lc_tic-*_tess.json`, records `baseline_days` + `sector_count`, pytest.
- [ ] Light 3 — mission wiring: `star_name(id, mission)` switch; `vet(id, mission="kepler")` uses it (gate math untouched); hunt routes gain `?mission=` (default `kepler`, backward compatible), pytest.
- [ ] Light 4 — TESS seed pool: `scripts/build_frontier_seeds_tess.py` (offline) + `data/frontier_seeds_tess.json` + `hunt.pick_frontier_tess` (RNG-injectable), pytest.

## Success criteria

- [ ] TIC in TOI -> `is_recorded_tess` True; TIC not in TOI -> False. Live-checked.
- [ ] `fetch_lc_by_tic` caches a TESS LC with `mission="TESS"`, `baseline_days` and `sector_count` populated.
- [ ] `vet(id, mission="tess")` runs the same four gates via `"TIC {id}"` naming; the Kepler path (default) is unchanged.
- [ ] Routes `GET /hunt/lc/{id}?mission=tess`, `/hunt/bls`, `/hunt/vet`, `/hunt/recorded`, `/hunt/frontier/random?mission=tess` are mission-aware; omitting `mission` stays Kepler.
- [ ] `pytest` green; zero change to the four-gate computation.

## Key decisions

- Reuse the vetting gate math verbatim; only star naming is mission-switched (KIC <-> TIC).
- Mission is an explicit `?mission=` query param (default `kepler`) because KIC and TIC id spaces can collide.
- The BLS layer is already mission-agnostic (`_find_lc_cache` iterates `tess`, `_get_full_lc` re-searches by `lc_meta["mission"]`) — no BLS change needed.
- TOI membership (by `tid`) is the recorded gate, mirroring KOI `kepid` membership (honesty nail 3).
- The seed pool is built offline; runtime reads local JSON only (deterministic, honest).

## References

- PRD: `docs/specs/phase-10/PRD.md`
- TechSpec: `docs/specs/phase-10/TECHSPEC.md` (§2 backend, §5 data sources, §9 sub-phase split)
- Milestone: Phase 10 — Skyward (#11)
