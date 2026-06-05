## Plan
Final sub-phase of Phase 3. Land camera-follow on top of the imperative CameraRig (3-4), clear three carryover items surfaced during the 3-6 smoke test, pass a mobile/performance/Lighthouse sweep, then close Phase 3 with a handoff to Phase 4 (Black hole).

## Lights
### A — Foundation cleanup (carryover from 3-6)
- [ ] Fix PresetSelector overflow (offset by sidebar width)
- [ ] Add preset reset via nonce (presetLoadedAt) + reload button + R key
- [ ] Sample trail per substep, not per frame (+ ring-buffer length correction)
### B — Camera follow
- [ ] Add CameraController (imperative lerp, no keyed remount)
- [ ] Add follow target to CameraConfig / presets
- [ ] Add follow toggle control (aria-pressed)
### C — Closeout
- [ ] Branch MAX_SUBSTEPS for mobile (battery/heat)
- [ ] Stack ControlPanel on narrow viewports
- [ ] Meet Lighthouse Performance 85+ on /gravity

## Success criteria
- [ ] Camera holds the target body centered in 2-body / 3-body; toggle returns to free orbit
- [ ] Re-selecting the same preset re-seeds cleanly (even when perturbation is 0)
- [ ] Trails stay curved at 100x / 10,000x (no inscribed polygon)
- [ ] ControlPanel intact on mobile, ~60fps, Lighthouse Performance 85+

## Key decisions
- Camera follow is imperative lerp inside useFrame on top of CameraRig — never keyed remount (3-4 WebGL Context Lost lesson)
- Reset reuses selectPreset(currentId) via a nonce — no new reset path
- Trail equivalence asserted with toBeCloseTo (float residue, 3-6 lesson)

## References
- PRD: `docs/specs/phase-3/PRD.md`
- TechSpec: `docs/specs/phase-3/TECHSPEC.md`
- Previous retrospective: `docs/checks/phase-3/sub-3-6.md`