## Plan

Add planet interactions to the solar system scene:

- **Hover** -> 3D label (drei `<Html>`) attached to the planet, showing name + one-line key fact
- **Click** -> camera zooms to the planet and *tracks* it through orbit (custom tween + per-frame `target` update)
- **Time-paused click** = snap effect automatically (target update with stationary planet behaves as snap, no extra branch)
- **[Camera Reset]** button in ControlPanel, *separate from* `Unified Reset` button
  - Camera is treated as an *exploration tool* — solo undo is a frequent, distinct user intent. Consciously different from sub-2-4 time+mode reset unification.
- **Unified Reset** also clears `selectedPlanetId` and resets camera position (consistent with *all-the-way-back* meaning)
- **User manually orbits camera** -> tracking yields (user intent wins)

## Lights

- [ ] Add `selectedPlanetId` + `selectPlanet`/`deselectPlanet` actions to store
- [ ] Wire `onPointerOver/Out/Click` on `Planet` component
- [ ] Hover label component via drei `<Html>` (attached, conditional render)
- [ ] Enrich label content (name, type, one-line key fact)
- [ ] `CameraController.tsx` — interpolate camera target/position on selection change; per-frame target = current planet position (tracking)
- [ ] Yield camera tracking when the user manually orbits (intent conflict resolution)
- [ ] `[Camera Reset]` button in ControlPanel + extend `Unified Reset` to also clear selection
- [ ] Integration check, 60fps verification, retrospective + doc updates

## Success criteria

- [ ] All 8 planets show a hover label (including small ones: Mercury, Mars)
- [ ] Click triggers a 1.5s camera zoom-in
- [ ] Orbiting planet stays roughly centered while tracked (1x speed)
- [ ] Time-paused click behaves as snap (no tracking needed since the planet does not move)
- [ ] `[Camera Reset]` returns camera to initial position and deselects the planet
- [ ] `Unified Reset` also clears selection and resets camera (consistency with sub-2-4 reset philosophy)
- [ ] User-initiated orbit interaction yields tracking
- [ ] 60fps maintained during hover/click/tracking
- [ ] `npm run build` passes (sub-2-4 lesson — tsc strictness over vitest looseness)

## Key decisions

- **Camera pattern: tracking, not snap.** PRD section 3 *"clicking Earth shows the Moon"* implies camera-planet companionship. Time-paused state automatically produces snap effect — both satisfied with one path.
- **Hover panel: 3D label via drei `<Html>`.** Preserves Phase 2 soul of *"information lives in space"*. DOM tooltips break the spatial feel.
- **Camera reset: separate button**, not unified. Camera is an *exploration tool* — solo undo is a frequent, distinct user intent. Consciously different from sub-2-4 reset unification.
- **`hoveredPlanetId` stays local** to the `Planet` component (no store). Hover is a planet own business; `useState` is enough. Only `selectedPlanetId` (cross-component) goes to store.
- **Camera interpolation reuses `lib/easing.ts`** (`easeInOutCubic`, 1.5s) from sub-2-4. Same patterns, deeper composition.

## References

- PRD: `docs/specs/phase-2/PRD.md` section 3 / section 4 (Item 5)
- TechSpec: `docs/specs/phase-2/TECHSPEC.md` section 1 (camera/hover/reset decision rows), section 2 (CameraController, ControlPanel), section 3 (camera interpolation reuses easeInOutCubic from sub-2-4)
- Previous sub-phase retrospective: `docs/checks/phase-2/sub-2-4.md`