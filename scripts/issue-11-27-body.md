> ⚠️ **Filed retroactively on 2026-09-11.** This sub-phase ran on 2026-09-08 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Path A's four sensitivity levers are all null: the pipeline cannot lower these floors, so the way to
more Earth-size-sensitive targets is **more quiet dwarfs**, not a sharper eye (vision §9-2). Sectors
103/104/105 are fully searched, and only ~6% of even carefully-chosen dwarfs turn out quiet enough to
reach Earth size — so a blind fetch marathon is wasteful, and a fetch is the slow step.

The question that opens widening: **can catalog values we already have predict which unsearched star
will reach Earth size**, so the fetch budget lands there first? Build it, measure its honest skill, and
open the first new sky with it.

## Lights

- [x] `952afe4` — `scripts/predict_earth_reach.py`: fit `log(floor) = a + b·Tmag` from the stars we
      have already searched (measured floor + catalog Tmag), rank an unsearched pool by predicted
      minimum planet radius (`sqrt(predicted_floor)·R★`), and **report its own skill on a held-out
      half**. Pure fit / predict / rank / validate tested (8).
- [x] `5a026a7` — a 100-dwarf **sector-102** pool built to its own file (`--pool`): R★ 0.18–1.27 R☉,
      absent from TOI.
- [x] `f9b6601` — first batch of 8 fetched and searched; check doc + instrument log.

## Success criteria

- [x] widening predictor built and validated on a held-out half (precision 1.00 / recall 0.25)
- [x] the tool reports its own skill, so the claim cannot drift from the measurement
- [x] first new sky opened: sector-102 pool (100 dwarfs); first batch of 8 fetched + searched
- [x] result: 0 candidates, **1 new Earth-size-sensitive target** (TIC 107548305, 0.87 R⊕)
- [x] the two significant dips rejected as instrument artifacts, named by their gates
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **Brightness is a weak, one-sided predictor.**
  `log(floor) = −9.58 + 0.366·Tmag` (n=179, in-sample R² = 0.172); held out (train 90 / test 89):
  **precision 1.00 · recall 0.25**, median |err| 2.02 R⊕. When it says Earth-size it is right; it misses
  three quarters. A low floor comes from quietness — red noise, crowding, variability — that no
  catalog value foretells. A pre-filter for *where to look first*, never a verdict.
- **Sector 102, first batch (10 of 100 searched, two shared with earlier sectors):** 3 quiet ·
  5 insignificant · 2 rejected · 0 candidates. TIC 238831201 (sig 9.12, symmetry) and TIC 1508739556
  (sig 16.24, edge + symmetry) — the same instrument signature the pool sweeps kept finding.
- **★ The payoff, and the lesson.** TIC 107548305 was the predictor's sharpest pick but predicted at
  **1.60 R⊕ — not Earth-size**. Its measured floor puts it at **0.87 R⊕ — Earth-size.** The quiet
  dwarf beat its predicted floor: the recall < 1 limit, live in the wild. Trust a positive prediction,
  but never read a non-positive as a rejection — so widening searches the sharpest *predicted* targets
  rather than trusting the label. Prediction points; only a search measures.
- Across the three pools, **12 Earth-size-sensitive targets, 0 surviving candidates.**
- Scope stated: the fit is over ~179 searched dwarfs from two pools; a different population (giants,
  very faint targets) would fit differently. One batch of 8 is a small sample; 90 of the sector-102
  pool remain.

## References

- Retrospective: `docs/checks/phase-11/sub-11-27.md`
- Tool: `scripts/predict_earth_reach.py` · pool `backend/data/pool_s0102.json`
- Vision: `docs/vision/finding-our-own-planet.md` §9-3
- Previous: `docs/checks/phase-11/sub-11-26.md`
