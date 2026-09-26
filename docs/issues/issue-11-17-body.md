> ⚠️ **Filed retroactively on 2026-09-09.** This sub-phase ran on 2026-08-15 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

The 50-dwarf pool is searched end to end with zero candidates. That is a complete search, not an
exhausted sky: sector 104 holds ~12,700 un-cataloged 2-min targets and `select_for_hunt` had kept
only the 50 smallest. With no new TESS sector released yet (105 is still empty on MAST), the honest
next sky is the **next-smallest dwarfs of the same sector**.

Rebuild the pool at `--n 100`, and search a first extension batch.

## Lights

- [x] `3fc68be` — rebuild `backend/data/frontier_seeds_tess.json` at `--n 100` (sector 104); still
      entirely planet-size (`assess_pool`: 100 plausible, 0 too_big). Pin `--n 100` in
      `.github/workflows/frontier-refresh.yml` — without it the default `n=50` would silently shrink
      the pool on the next refresh and drop half the searched stars.
- [x] `fb357c2` — first extension batch: 8 new dwarfs fetched and searched; instrument log.
- [x] `aeb28ea` / `210b9a6` — check doc + README.
- [x] `e23d993` / `6d792fb` — `scripts/search_pending.py`: the missing middle of the
      fetch / search / count loop (search what is fetched-but-unsearched), reusing `tally_hunt`'s
      helper; its plan pinned by tests including the stale-memo case.

## Success criteria

- [x] pool widened 50 → 100 by the builder (not hand-edited), still 100% planet-size
- [x] the biweekly Action passes `--n 100` so a refresh cannot silently shrink the pool
- [x] the resample's 2 dropped stars are acknowledged; no searched verdict is lost
- [x] a first extension batch (8 dwarfs) fetched from MAST and searched, verdicts recorded honestly
- [x] the cumulative tally is recomputed from the caches (56 of 100), not hand-counted
- [x] the new significant event (sig 41.26) and the gate that killed it (symmetry, not edge) recorded
- [x] pytest green (189)
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **The resample is honest about what it drops.** `select_for_hunt` samples a seed-10 candidate pool
  whose size scales with `n`, so growing `n` is not a strict superset: 48 of the searched 50 survive,
  2 were dropped. Their verdicts remain recorded in sub-11-16 — no searched star's result is lost,
  only its membership in the *live* pool. `tally_hunt.py` reads per star, so it reports what is on
  disk.
- **The first symmetry-only rejection.** Across the first fifty dwarfs every significant event died
  to **edge**. This batch produced the exception: TIC 404030766, sig 41.26 — the second-loudest event
  in the pool, sitting **mid-segment** where edge never fires, killed by **symmetry** alone. The
  shape gates are a *set*, not a single trick: a loud systematic that does not ride a downlink
  boundary still fails because its shape is wrong.
- **Batch result:** 4 quiet · 3 insignificant · 1 rejected · 0 candidates. Cumulative
  **56 of 100 — 24 quiet · 24 insignificant · 8 rejected · 0 candidates**; 44 pending.
- No test hardcodes 50 any longer; `test_pool_assessment` asserts the live count `>= 100` and
  dwarf-dominance.

## References

- Retrospective: `docs/checks/phase-11/sub-11-17.md`
- Tools: `scripts/search_pending.py` · `scripts/tally_hunt.py`
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-16.md`
