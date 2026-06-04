## Plan
Wire visual-speed time controls into the gravity scene while keeping physics
accuracy independent of visual speed. The integration dt stays fixed at each
preset's `recommendedDt`; visual speed only changes how many substeps run per
frame (faster = more substeps, paused = none). This is the answer to the
handoff's core question — "how do we separate the integration timestep from the
speed slider" — and the discipline is hard: speed must never scale dt, because
scaling dt is exactly how Euler breaks the universe in 3-5.

## Lights
- [ ] Light 1 - feat: wire timeSpeed + pause into gravity store (if not already wired from 3-4)
- [ ] Light 2 - refactor: drive Integrator substeps from store timeSpeed (replace TIME_SPEED constant); paused skips the loop
- [ ] Light 3 - fix: cap substeps (MAX_SUBSTEPS) to guard frame drops at high speed / mobile
- [ ] Light 4 - feat: time controls UI in gravity ControlPanel (pause + 0.1x/1x/100x/10000x, reuse ControlButtons)
- [ ] Light 5 - feat: keyboard shortcuts (Space pause, 1-4 speeds) + aria-pressed
- [ ] Light 6 - test: substep chunking invariance + paused = no advance
- [ ] Light 7 - test: integration check + retrospective + doc updates

## Success criteria
- [ ] Pause + speeds (0.1x..10000x) work; keyboard parity with Phase 2
- [ ] Physics accuracy independent of visual speed: same IC at any speed yields the same orbit (chunking-invariance regression test, PRD section 5)
- [ ] Paused = state unchanged (test)
- [ ] No visible frame drop at 10000x (MAX_SUBSTEPS cap); dt is never scaled
- [ ] Each commit passes `npm run build` (sub-3-5 troubleshooting 1: every commit must compile)
- [ ] 60fps on desktop

## Key decisions
- Fixed dt = preset.recommendedDt; visual speed = substeps-per-frame only. The
  cap clips the count, never the dt, so trajectory shape is preserved and only
  the wall-clock pace changes -> determinism holds across all speeds.
- No separate time-reset action - preset reselect already restores a clean IC
  (sub-2-4 reset-unification / YAGNI: one user intent = one action).
- TDD partial: store/UI untested; the single regression lives in the pure core
  (chunking invariance), since 3-6 only adds the chunking layer over the already
  verified integrators (3-1/3-2). Physics truth = vitest (PRD section 6).
- CameraController body-tracking carried to 3-7 (deferred from 3-5) - one
  sub-phase, one concern.

## References
- PRD: `docs/specs/phase-3/PRD.md` section 4 item 6, section 5
- TechSpec: `docs/specs/phase-3/TECHSPEC.md` section 1 (timestep<->speed row), section 2 (substep loop), section 7
- Previous retrospective: `docs/checks/phase-3/sub-3-5.md`
