> ⚠️ **Filed retroactively on 2026-09-09.** This sub-phase ran on 2026-08-14 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

Walk the sub-11-14 dwarf pool to the end: fetch and search the remaining 17 curves so all 50
smallest-first M/K dwarfs carry an honest verdict.

And take the hand off the count. sub-11-15 caught a hand *reading* of an event drifting; the
cumulative tally in the instrument log is still hand-maintained, which is the same exposure one step
over. Build a script that recomputes the tally from the on-disk caches, so a disagreement between
the log and the script means the *log* is stale, not the sky.

## Lights

- [x] `a2b490e` — fourth batch (8 dwarfs): 38 searched; the sig-61.99 edge artifact, the loudest
      event the pool has produced.
- [x] `a323e07` — `scripts/tally_hunt.py`: recompute searched / fetched-not-searched / not-fetched
      from the caches, reading dispositions via the same `_event_disposition` the hunt uses. It
      never fetches and never recomputes.
- [x] `593f9df` — fifth batch (9 dwarfs): **the whole dwarf pool is searched, 50/50**.
- [x] `3f14574` / `033e9d2` — check doc + README.
- [x] `cdef1ac` — `test_tally_hunt.py` pins the cache classification, including the stale-memo
      fallback (an `lc` mtime mismatch must count as *not searched*, never as a stale verdict).

## Success criteria

- [x] all 50 sub-11-14 dwarfs fetched and searched, every verdict recorded honestly
- [x] the final tally is computed from the caches by a script, not hand-counted
- [x] the tally script distinguishes searched / fetched-not-searched / not-fetched and never fetches
- [x] that classification (including stale-cache fallback) is pinned by tests (`test_tally_hunt.py`)
- [x] the hand-count drift (38 vs 41) is caught, explained, and corrected in the log
- [x] the seven significant single events and the gate each failed are recorded
- [x] the significance precondition and disposition order are unchanged
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **Final ledger: 21 quiet · 22 insignificant · 7 rejected · 0 candidates** over 50 real dwarfs.
- **Every significant single event across fifty dwarfs was an edge artifact** (sig 6.02 up to
  61.99). Significance was necessary — all seven cleared the floor — and never sufficient. That is
  the Phase-11 thesis, now measured at whole-pool scale.
- **The tally caught a drift on its first run.** The numbered batches in the log summed to 38, but
  three dwarfs searched earlier during sub-11-12/13 tooling were never added: the real count was 41.
  The counterpart to sub-11-15 — there a hand *reading* drifted, here a hand *count* did. Both fixes
  have the same shape: stop letting a hand stand between the caches and the record.
- **Honest boundary:** this completes a search, it does not make a discovery. Fifty quiet stars,
  empty hands — the expected and honest outcome. The next real sky is the next TESS sector.

## References

- Retrospective: `docs/checks/phase-11/sub-11-16.md`
- Tool: `scripts/tally_hunt.py` · `backend/tests/test_tally_hunt.py`
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-15.md`
