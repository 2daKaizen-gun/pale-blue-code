> ⚠️ **Filed retroactively on 2026-09-10.** This sub-phase ran on 2026-08-18 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Twenty-four dwarfs remain unfetched at the end of sub-11-18. Fetch and search all of them so the
widened sector-104 pool stands complete at 100 of 100 — the honest close of the pool the last four
sub-phases were filling. No new code: a pure observation run under the existing `mono-v2` pipeline.

Then bound the null properly. A zero-candidate sweep is only worth **the sensitivity it actually
achieved**, curve by curve — and the fiducial 0.4% planning depth overstates that.

## Lights

- [x] `3c35dd5` — final 24 dwarfs fetched (0 failed) and searched; the full sweep logged.
- [x] `7e5addb` / `92829a9` — check doc + README: the pool is complete.
- [x] `28850c2` — `pool_assessment.pool_completeness`: what fraction of a pool could actually have
      revealed a planet at each size, from **measured** floors. +3 tests.
- [x] `93b666f` — `scripts/completeness_hunt.py`: report a sweep's achieved sensitivity.
- [x] `a34e497` — **self-correction**: bound the null with achieved completeness, retiring the
      fiducial "1–7 R⊕" framing wherever it had been written.
- [x] `2d52e07` — README: correct the 11-19 null framing; list the new script.

## Success criteria

- [x] all 24 remaining dwarfs fetched (0 failed) and searched under `mono-v2`
- [x] the pool stands at 100 of 100 searched
- [x] tally recomputed from caches, not trusted: 42 quiet / 45 insignificant / 13 rejected / 0 candidates
- [x] the batch's one new rejection (TIC 380865605, sig 21.25) named by its gates
- [x] achieved completeness computed from MEASURED floors, not the fiducial (6/100 reach Earth-size)
- [x] the fiducial "1–7 R⊕" framing corrected; the null bounded by the sensitivity actually achieved
- [x] observation log and check doc record the completion honestly

## Key decisions

- **Final ledger: 100 of 100 — 42 quiet · 45 insignificant · 13 rejected · 0 candidates.** All
  thirteen significant events are instruments or systematics, each named by the gate that caught it:
  edge and symmetry carry the load, `baseline` caught the sub-11-18 candidate, coherence assists twice.
- **The self-correction is the real content.** Measured floors give best **0.9 R⊕ · median 4.7 R⊕ ·
  worst 33.3 R⊕**: only **6 of 100** curves were clean enough to have shown an Earth, 14 a
  super-Earth, and 7 could not have revealed anything planet-size at all. So the honest reading is
  *not* "no Earths transit these stars" — it is sub-Saturn-and-larger ruled out across most of the
  pool, and Earth-to-super-Earth only on the ~1/7 whose curves reached that depth.
- **A null stated completely** — with the sensitivity that bounds it written beside it — is what a
  real search reports when it comes up empty.
- pytest 192 → 195.

## References

- Retrospective: `docs/checks/phase-11/sub-11-19.md`
- Tool: `scripts/completeness_hunt.py` · `backend/services/pool_assessment.py::pool_completeness`
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-18.md`
