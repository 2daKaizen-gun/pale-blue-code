> ⚠️ **Filed retroactively on 2026-09-09.** This sub-phase ran on 2026-08-12 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

A real observation exposed a legibility gap in our own tool. The drilldown showed each dip's
significance and fate-colour but not *why* a dip failed, so a sub-threshold blip sitting on a
segment edge looked identical to clean noise. That gap let the sig-4.98 event on TIC 91636864 be
written up in the instrument log as a wistful near-miss when it was, in fact, another edge artifact
— sub-threshold **and** shape-rejected (0.075 d from a boundary, against the 0.1 d clearance).

Carry the failed-gate list to the drilldown for every event, and correct the overstated log entry.
No new physics: the gates already run for every event — we were dropping the answer.

## Lights

- [x] `5204c53` — correct the instrument log: the sig-4.98 event is an edge artifact, not a
      near-miss. My own prose re-verified against the data.
- [x] `3ce69f3` — the curve payload carries `failed_checks` for **every** event regardless of
      significance, read off the same `checks` the search used.
- [x] `dcb93a6` — the drilldown lists each dip's significance, one-word fate (후보 / 기각 / 잡음)
      and short reason (경계 / 스파이크 / 플레어 / 비대칭); guards a stale response predating the field.
- [x] `baf5a91` — third dwarf batch searched (10 more), logged.
- [x] `dada14e` / `dd99852` — check doc + README.

## Success criteria

- [x] the curve event payload names the shape gates each event failed, for every event
- [x] the drilldown shows each dip's significance, fate, and failed-gate reason in plain language
- [x] the overstated instrument-log entry (sig-4.98 as near-miss) is corrected to "edge artifact"
- [x] the failed-gate list is read off the same checks the search used, proven by test
- [x] the significance precondition and disposition order are unchanged
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **It surfaces a computed fact, it does not invent one.** `failed_checks` is asserted event-by-event
  against the search result in `test_curve_matches_the_searched_events_exactly`, never re-derived.
- **The precondition is untouched.** Below-floor events stay `insignificant`; the disposition order
  (candidate > rejected > held > insignificant) is unchanged. The failed-gate note is secondary
  information on the curve view, not a promotion path.
- **It works against romanticizing noise** — the exact failure mode that produced the overstated log
  entry. The drilldown now reads `딥 4.98σ · 잡음 · 경계에 걸림`.
- **Third batch:** 5 quiet · 3 insignificant · 2 rejected · 0 candidates. Cumulative 30 searched;
  all four significant single events so far caught by the edge gate.

## References

- Retrospective: `docs/checks/phase-11/sub-11-15.md`
- Observation log: `docs/observations/instrument-log.md`
- Previous: `docs/checks/phase-11/sub-11-14.md`
