## Plan
Add Earth's Moon as a fully interactive body: it orbits Earth while staying
tidally locked (same face toward Earth), recedes and vanishes together with
Earth under the distance toggle, and is clickable for camera tracking
("Earth from the Moon" viewpoint). Also finish the control panel — D/T/A/C
keyboard shortcuts (PRD §6 accessibility) and extraction of duplicated button
styles. This closes the last unimplemented PRD §4 feature.

## Lights
- [x] Light 1 — chore: add moon texture asset + ATTRIBUTION
- [x] Light 2 — feat: MoonData type + PlanetData.moon + earth entry
- [x] Light 3 — refactor: extract getInitialAngle helper (Scene + CameraController)
- [x] Light 4 — feat: computeMoonVisualDistance (parent-relative) + vitest
- [x] Light 5 — feat: Moon.tsx orbiting + tidally locked, mounted under earth
- [x] Light 6 — refactor: extract getBodyWorldPosition resolver (sun/planet) + vitest, use in CameraController (behavior-preserving)
- [x] Light 7 — feat: add 'moon' to BodyId + moon case in resolver + moon click/hover/label
- [x] Light 8 — feat: D/T/A/C keyboard shortcuts + aria labels
- [x] Light 9 — refactor: extract ToggleButton / IconButton from ControlPanel

## Success criteria
- [x] Moon orbits Earth keeping the same face toward it (tidal lock)
- [x] Distance toggle: Earth + Moon recede and vanish together
- [x] Clicking the Moon tracks it; clicking Earth frames the Moon too (PRD §3)
- [x] D/T/A/C work, ignored while an input/textarea is focused, zero conflict with Space/R/1-4
- [x] Panel button extraction with no visual or behavioral regression
- [x] 60fps maintained (8 planets + moon + starfield + camera)

## Key decisions
- Moon is a child of Earth's outer (orbit-position) group, OUTSIDE the
  axial-tilt group — it inherits Earth's position but not its rotation or tilt.
  Tidal lock = bind the moon mesh rotation to its own orbit angle.
- Risk removal for click-tracking: the moon's world position is a deterministic
  pure function of store state (simulationDays + interpolated ScaleConfig),
  exactly like every planet — never read from the scene graph. A single
  `getBodyWorldPosition(bodyId, simulationDays, scaleConfig)` resolver returns
  position+radius for sun/planet/moon and is shared by Moon rendering and camera
  tracking, so the two can never drift. vitest-covered.
- Incremental de-risk: Light 6 first refactors existing inline sun/planet
  branches in CameraController into the resolver (behavior-preserving), then
  Light 7 adds the moon as one more tested case. No big-bang change.
- getInitialAngle single-sourced (Light 3) so Earth's orbit angle is identical
  wherever computed → moon offset anchors to Earth correctly.
- Moon visual distance is parent-relative (computeMoonVisualDistance) — a modest,
  relatively stable offset so the moon hugs Earth and they vanish together under
  the distance toggle, rather than flying off.
- Keyboard: d/t/a/c (case-insensitive); no conflict with Space/R/1-4; ignored
  when an input is focused.

## References
- PRD: `docs/specs/phase-2/PRD.md`
- TechSpec: `docs/specs/phase-2/TECHSPEC.md`
- Previous retrospective: `docs/checks/phase-2/sub-2-5.md`