> ⚠️ **Filed retroactively on 2026-09-09.** This sub-phase ran on 2026-08-07 without a GitHub
> issue — the charter requires one per sub-phase (`docs/COLLABORATION.md` §4) and we skipped it for
> sub-11-13 through sub-11-27. This body is reconstructed from the retrospective and the commits so
> the tracker matches the work; it is not a record written before the work.

## Plan

The hunt says one honest sentence per star, and the drilldown shows its numbers — but a person still
cannot *see* what the detector saw. Draw the curve behind a verdict: the same searched signal, with
each found dip marked and coloured by its fate. This closes the last open item in
`docs/vision/making-the-tool-legible.md` §4, so a star's whole story reads end to end — one
sentence, its numbers, and its light.

The picture must be the search's *own* input, never a differently-processed one that could tell a
different story.

## Lights

- [x] `6e6abfa` — `services/monotransit.py::monotransit_curve`: load → detrend → normalize
      (identical to `run_monotransit`), decimate to ~3000 points, attach the cached events. New
      route `GET /api/monotransit/{name}/curve`, declared before `/{planet_name}` so the suffix
      resolves; 424 for an unfetched star. 4 tests.
- [x] `c07c2a6` — `monotransitCurve` client + `MonotransitCurveChart.tsx` (d3 scatter with event
      bands), wired into the `StarRow` drilldown as a lazy, per-star "광곡선 보기".
- [x] `0f30e38` — check doc; `making-the-tool-legible.md` marked complete.

## Success criteria

- [x] a new endpoint serves the searched (detrended, normalized) curve, decimated for display
- [x] events are attached with their verdict, byte-matched to what the search records
- [x] 424 for an unfetched star; no curve is ever drawn for one
- [x] the drilldown loads the curve lazily, per star, never on page load
- [x] markers are coloured by fate (candidate / rejected / insignificant); a quiet star is flat
- [x] check doc under `docs/checks/phase-11/`

## Key decisions

- **The plot is the search's input, proven by test.** `monotransit_curve` reruns the exact
  preprocessing `run_monotransit` uses, and `test_curve_matches_the_searched_events_exactly` pins
  that the events carried are the same objects the search recorded (same `t0`, same verdict).
- **Colour is fate, not loudness.** The sig-74 rejection (TIC 352404492) draws **red**, not green —
  the picture refuses to flatter a loud artifact, exactly as the verdict does.
- **Cost paid on demand.** A real curve is ~10^5 samples; loading every row on page load would undo
  the sub-11-12 speedup. The curve loads only on click, per star, from the warm memo.
- **Honest boundary:** this makes the tool *legible*, not more *capable*. Same search, same zero
  candidates — a window into the verdict, not a new verdict.

## References

- Retrospective: `docs/checks/phase-11/sub-11-13.md`
- Vision: `docs/vision/making-the-tool-legible.md` §4 (closed by this sub-phase)
- PRD / TechSpec: `docs/specs/phase-11/`
- Previous: `docs/checks/phase-11/sub-11-12.md` (#60)
