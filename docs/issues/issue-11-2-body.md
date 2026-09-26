## Plan

sub-11-1 gave the pipeline a detection-significance precondition, but it is built
for **repeated** transits: it folds on a BLS period and measures depth against the
scatter *between* transits (k >= 2). A monotransit — the long-period planet that
appears exactly once in a 27-day sector — has k = 1, so that machinery is blind to
it, and BLS discards it outright because BLS needs repetition. That is precisely the
gap `docs/vision/finding-our-own-planet.md` names as our main frontier (section 3):
what the machines miss.

sub-11-2 lays the **first brick of the single-transit search**: a backend service
that scans a detrended light curve for one isolated, transit-shaped dip that no
repetition-based search would surface, scores it with a single-event significance
designed *fresh* (sub-11-1's between-transit statistic cannot be reused at k = 1),
and guards it with discriminators built for a lone event — not the four repetition
gates, which all assume something recurs.

This is a backend-only brick. The visual vetting UI (vision section 5.4) and the
ExoFOP follow-up bridge come in later sub-phases. Honesty guardrails hold: what this
finds is a *light-curve single-transit candidate*, a lower bar than a TOI, and the
report must say so.

## Lights (proposed)

- [ ] Light 1 — `services/monotransit.py`: a transit model (trapezoid: ingress,
  flat floor, egress) and a matched-filter score at a fixed (t0, duration, depth).
  Pure, unit-tested against injected dips. No search yet — just the primitive.
- [ ] Light 2 — single-transit search: slide the matched filter across the detrended
  light curve over a grid of durations, build a Single Event Statistic (SES) series,
  and pick isolated local maxima as candidate events. Explicitly exclude any event
  that is part of a repeating series (that is BLS's job, not ours). Returns
  candidates as (t0, duration, depth, ses).
- [ ] Light 3 — single-event significance, designed fresh: normalize the SES against
  the light curve's *red* (correlated) noise, not white — the sub-10-3 lesson that
  dividing by sample count manufactures confidence applies doubly to one event. The
  threshold is **measured, not asserted** (as `_N_MIN_TRANSITS` and `_SIG_MIN` were):
  inject transits at known depth/duration into real single-sector TESS light curves,
  measure recovery vs a false-alarm rate, and read the cut from the gap.
- [ ] Light 4 — lone-event discriminators (a single-event guard, NOT the four gates):
  reject momentum-dump / edge-of-sector artifacts, single-cadence spikes, and obvious
  stellar flares (a brightening, not a dimming); require ingress/egress symmetry. Each
  is a measured rule with a reason, never a magic number.
- [ ] Light 5 — reachability: a `MonotransitCandidate` model and a backend entry point
  (service function + HTTP route) that runs lc -> detrend -> single-transit search ->
  significance -> discriminators on a real TIC. `pytest` green.
- [ ] Light 6 — Check doc `docs/checks/phase-11/sub-11-2.md`: the live single-sector
  TESS run, the injection-recovery table behind the measured threshold, and the honest
  boundary (what it still cannot tell apart).

## Success criteria

- [ ] A single injected transit in a real single-sector TESS light curve is recovered
  as a candidate event, with a significance figure computed against correlated noise.
- [ ] The significance threshold is read from an injection-recovery measurement, not
  asserted; the Check doc shows the table and the gap the cut sits in.
- [ ] A momentum-dump / edge artifact and a stellar flare are each rejected by a named
  discriminator, not by the significance cut alone.
- [ ] The report frames a survivor as a *light-curve single-transit candidate* (a lower
  bar than a TOI), never as a detection or a planet (honesty guardrails, vision s7).
- [ ] `pytest` green; if any frontend touches land, `npm run build` green.

## Key decisions / invariants

- **Fresh significance at k = 1.** sub-11-1's between-transit t-statistic needs k >= 2
  and is left untouched; the single-event statistic is a separate quantity.
- **Not the four gates.** odd/even, secondary, shape, size all assume repetition. A
  lone event gets its own discriminators; the four gates are not called here.
- **Measured, not guessed** (nail 3) — every threshold on screen must trace to an
  injection-recovery run recorded in the Check doc.
- **Honesty bar** (vision s7) — output is a first-pass, light-curve-only *candidate*;
  false-positive channels (giants, systematics, blends) are surfaced, never hidden.
- **Frontier separation invariant** still holds if any route is added: nothing new in
  `frontend/src/constants/phases.ts`.

## References

- `docs/vision/finding-our-own-planet.md` — sections 3 (the gap), 5 (path B roadmap), 7 (honesty)
- `docs/checks/phase-11/sub-11-1.md` — the significance precondition and its k >= 2 boundary
- `backend/services/vetting.py` — `detection_significance` (repeated-transit), the four gates
- `backend/services/bls.py` — the repetition-based search this deliberately steps outside of
- Milestone: Phase 11 — What the Machines Missed (#12)
