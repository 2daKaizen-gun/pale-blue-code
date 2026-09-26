## Plan
Bring Phase 3's soul to the screen: toggling the integrator [Euler | RK4] makes a stable two-body orbit spiral apart (Euler) or stay closed (RK4), backed by a live energy/momentum readout that spikes vs. stays flat. Add a chaos perturbation slider for the three-body figure-8. No new physics — wire already-proven pure functions (rk4Step/eulerStep, totalEnergy/angularMomentum) into a felt experience.

## Lights
- [x] Wire setIntegrator + branch step in Integrator.tsx via getState().integrator
- [x] Add [Euler | RK4] toggle control (ControlButtons reuse, aria-pressed)
- [x] Add DEV-only leva for dt/softening tuning; verify Euler divergence in browser
- [x] Unit-test energyDrift + applyPerturbation (determinism, perturbation 0 = identity)
- [x] EnergyReadout.tsx: read bodiesRef, throttled (~6Hz) E/L compute
- [x] Capture E0/L0 on preset load; show relative drift bar + numeric value
- [x] Verify toggle <-> readout in browser: Euler spikes / RK4 flat
- [x] Add chaos perturbation slider (three-body only)
- [x] Apply perturbation on re-init (deterministic, figure-8 preserved)

## Success criteria
- [x] Two-body: Euler -> spiral divergence + ejection, RK4 -> closed orbit (a first-time viewer reacts "it broke" -> "it closed")
- [x] Readout: Euler bar spikes / RK4 flat, numeric beside bar, keyboard-operable, aria-pressed
- [x] RK4: relative dE/E0 ~0 and dL/L0 < 0.01% visible in the readout
- [x] Three-body perturbation slider splits the fate; perturbation 0 keeps the figure-8
- [x] tsc -b green + npm run build + npm run test:run + browser round-trip

## Key decisions
- Readout shows relative drift |E-E0|/|E0|, not absolute energy (units differ per preset; matches PRD "bar spikes/flattens")
- Readout updates via throttled setState (~6Hz) in a Canvas-outside component, preserving the zero-rerender physics-in-ref philosophy
- Integrator branch reads getState().integrator (no subscription, no rerender)
- Euler demo runs on two-body (e=0.3), never two-body-circular (bit-identical to the sub-3-2 conservation fixture; do not touch)
- Perturbation is deterministic: same value -> same divergence; 0 -> published figure-8 IC untouched
- Out of scope (-> 3-6): CameraController body-tracking, time-control store wiring / substep split, paused toggle

## References
- PRD: `docs/specs/phase-3/PRD.md` (§3 the one second, §4 item 5, §5 quantitative)
- TechSpec: `docs/specs/phase-3/TECHSPEC.md` (§1 integrator rows, §7 sub-phase split)
- Previous retrospective: `docs/checks/phase-3/sub-3-4.md`