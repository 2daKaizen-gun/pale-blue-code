## Plan

sub-10-3 is the front of Phase 10 — Skyward: bring the TESS backend (sub-10-1)
and honesty nail 4 (sub-10-2) to the user through a **frontier hub**, mission-aware
hunt UI, and the first **live TESS end-to-end** run. It closes the phase.

A discoverable hub lets a hunter choose the sky before hunting: Kepler (0.25% of
the sky, 4 years deep) or TESS (~85% of the sky, ~27 days shallow). The hunt page
becomes mission-aware and renders nail 4 honestly — a `strong` earned on too few
transits reads as *provisional strong*, with baseline / sector badges saying how
much of the sky we actually saw.

## Lights (proposed)

- [ ] Light 1 — frontier hub `FrontierHubPage`: one discoverable entry that offers
  Kepler vs TESS, framed by what each sky trades (breadth vs depth). Reached via a
  nav element that is **NOT** in `phases.ts` (separation invariant — see below).
- [ ] Light 2 — mission-aware `FrontierHuntPage`: thread `mission` through the
  picker → `frontierRandom` / recorded-gate / lc → bls → vet calls; TESS uses the
  TESS seed pool and TOI recorded-gate; Kepler path unchanged (default).
- [ ] Light 3 — nail-4 rendering: *provisional strong* wording + baseline_days /
  transit_count / sector_count badges in the vetting report card, honest about how
  much was seen. No new verdict; reuse `VettingReportCard`.
- [ ] Light 4 — live TESS E2E + calibration: fetch → BLS → vet on a real TIC;
  calibrate `_N_MIN_TRANSITS` (=5, provisional) and the detrend SG window against
  real TESS cadence. Record the run in a Check doc.

## Success criteria

- [ ] Hub reachable and discoverable without being listed in `phases.ts`; picking
  Kepler or TESS lands on the mission-correct hunt flow.
- [ ] A TESS hunt runs end-to-end on a real unrecorded TIC (fetch → BLS → vet).
- [ ] A short-baseline TESS `strong` renders as *provisional*, with baseline and
  sector badges; a Kepler `strong` renders normally (no provisional).
- [ ] `_N_MIN_TRANSITS` and the detrend window are checked against real TESS cadence
  and adjusted if the live run disagrees (nail 3 — no undefendable number on screen).
- [ ] `npm run build` green; backend `pytest` still green.

## Key decisions / invariants

- **⚠️ Frontier separation invariant**: do NOT add `/hunt/frontier` (or the hub) to
  `frontend/src/constants/phases.ts` — nav is derived from PHASES and would
  auto-expose it. The hub is a **separate** nav element.
- Reuse `VettingReportCard` and the lc → bls → vet contract verbatim; nail 4 is a
  rendering concern, not new vetting.
- Live E2E is the gate for calibrating `_N_MIN_TRANSITS` and the detrend window;
  until it runs, those values stay provisional (honesty nail 3).

## References

- PRD/TechSpec: `docs/specs/phase-10/` (§9 sub-phase split)
- Prior: sub-10-1 (#45, backend), sub-10-2 (frontend-invisible nail 4)
- Checks: `docs/checks/phase-10/sub-10-1.md`, `sub-10-2.md`
- Milestone: Phase 10 — Skyward (#11)
