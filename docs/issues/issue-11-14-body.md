> ⚠️ **Filed retroactively on 2026-09-09.** This sub-phase ran on 2026-08-11 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

The tool is legible and honest, but it is searching the wrong stars. The frontier pool is ranked by
brightness, and bright TESS stars are giants — so only 16 of 50 are planet-size targets, and the
smallest planet any of them could reveal is ~7 Earth radii. A transit depth fixes companion
*radius* (`R_planet = sqrt(depth) * R_star`), so a brightness-ranked pool is a giant-ranked pool and
its detectable dips are star-sized.

Re-select the pool for the hunt: smallest stars first. This does not find anything — it points the
search somewhere a find is *possible*.

## Lights

- [x] `c02a535` — `select_for_hunt` + `--select` flag in `scripts/build_frontier_seeds_tess.py`:
      bright ENOUGH to register (`Tmag <= _TMAG_MAX`) and characterized (real Teff AND radius), then
      **smallest radius first**, brightness only as tiebreak. An unsized star sinks below every
      measured one. 6 unit tests.
- [x] `00952a4` — rebuild `backend/data/frontier_seeds_tess.json` from sector 104 under the new
      selector.
- [x] `be69415` — first real batch: 10 M dwarfs fetched from MAST and searched; instrument log.
- [x] `5432f05` — check doc + README.
- [x] `752d332` — pool copy still told the old giant story; corrected to dwarfs.

## Success criteria

- [x] a hunt-oriented selector ranks small, searchable stars first; brightness only breaks ties
- [x] the builder defaults to it; `--select bright` preserves the old feed order
- [x] the rebuilt pool is measured as ~all plausible (50/50), reaching M-dwarf / Earth-size targets
- [x] a first real batch is fetched and searched, with every star's verdict recorded honestly
- [x] pending targets stay `not_fetched`; no curve is faked
- [x] tests cover the selector; check doc under `docs/checks/phase-11/`

## Key decisions

- **The bug was the selection, not the search.** `select_bright` was right for the Phase-10 "fresh
  sky" feed (a showpiece star to come look at) and exactly wrong for the Phase-11 hunt. Both
  selectors stay; the pool JSON records which one built it.
- **The pool that resulted:** 50 plausible / 0 too_big / 0 unknown, smallest radii 0.15–0.30 R☉
  (Tmag ~12–13), where the fiducial floor implies a minimum detectable planet of **~1–2 R⊕**. The
  bright pool's best was ~7 R⊕.
- **What the sky said:** 7 quiet · 2 insignificant · 1 rejected · **0 candidates**. The rejection
  (TIC 370142187, sig 13.6) died to edge + symmetry — the third real-data proof that significance is
  necessary but never sufficient.
- **The pool is bigger, not the claims.** 37 of 50 stay `not_fetched`; more targets is more sky to
  search, not a stronger statement about any of it.

## References

- Retrospective: `docs/checks/phase-11/sub-11-14.md`
- Observation log: `docs/observations/instrument-log.md`
- Vision: `docs/vision/finding-our-own-planet.md`
- Previous: `docs/checks/phase-11/sub-11-13.md`
