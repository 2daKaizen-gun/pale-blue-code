## Plan
Introduce the preset selector — the first real stage for `gravityStore`.
Until 3-3 the scene ran on a single hard-coded system (`useRef` + inline
constants). 3-4 lets the visitor switch between preset systems (solar
system, two-body elliptical, two-body circular, three-body figure-8,
binary) from a panel outside the Canvas, while the Canvas reads the same
truth via the store. Preset switching remounts trails via React `key`.

## Lights
- [ ] Light 1 — Add `CameraConfig` + `camera` field to `Preset`; widen `id` to a 5-way union; migrate TWO_BODY / TWO_BODY_CIRCULAR
- [ ] Light 2 — Add three-body figure-8 preset (published IC, verified closes)
- [ ] Light 3 — Add binary-star preset (3:2, e = 0.4, verified)
- [ ] Light 4 — Add `mass_kg` to planets.ts + sun.ts; build solar-system preset (real AU, M_sun=1, G=1) + `PRESETS` registry
- [ ] Light 5 — Create `gravityStore` (Zustand): `presetId` + `selectPreset`
- [ ] Light 6 — Build `PresetSelector` panel (top-center, keyboard operable, `aria-pressed`)
- [ ] Light 7 — Drive Scene from selected preset: camera from preset, `<Trails key={presetId} />`, reinit `bodiesRef` on preset change

## Success criteria
- [ ] Selecting any preset loads clean initial conditions (Phase 2 reset spirit)
- [ ] Preset switch remounts trails — no stale ring-buffer points carried over
- [ ] Camera framing correct per preset (two-body ~units vs solar ~tens of AU)
- [ ] Figure-8 stays an "8" indefinitely when untouched (verified: closes to 5e-8 / energy 2.6e-13)
- [ ] Solar-system preset feels like a Phase 2 revisit (continuity)
- [ ] `gravityStore` read via `getState()` inside `useFrame` — zero per-frame re-renders (Phase 2 paradigm)
- [ ] `npm run build` (tsc -b) clean before push

## Key decisions
- `gravityStore` (Zustand) introduced here: selector UI (outside Canvas) and refs (inside Canvas) must share one truth — Phase 2 store pattern. Chosen over local useState because 3-5 (integrator toggle) and 3-6 (timeSpeed) will need the same `useFrame`-getState store.
- `camera` is a framing *config* (`position` + `far` + `min/maxDistance`), not just a position — 3-3's inline `[0, 0, 3]` / far=100 / 0.5-20 breaks once the solar system spans tens of AU.
- Solar system built from real NASA data: `mass_kg` stays on planets.ts/sun.ts (real values, data-layer philosophy); the preset layer normalizes to AU / M_sun / G=1. Circular ICs, sun absorbs recoil (net momentum zero), dt resolves Mercury.
- All bodies stay emissive (`meshBasicMaterial`) in 3-4 — no lighting/textures yet. Keeps Scene's "no inner Suspense" intact; lighting deferred.
- Preset switch = parent `key={presetId}` remount on Trails -> clean geometry/material dispose + fresh ring-buffer; folds the current `n`-based useMemo into the key.
- TWO_BODY (asymmetric) stays the visual two-body; TWO_BODY_CIRCULAR (sub-3-2's proved orbit) exposed as the "mathematically clean" option — presets double as learning slides.
- Selector is keyboard-operable (tab + Enter/Space, `aria-pressed`) but does NOT claim number keys 1-4 — those are reserved for 3-6's speed controls.

## Out of scope (deferred)
- Single-sourcing TWO_BODY_CIRCULAR with the test fixture (sub-3-3 retro: YAGNI until a second drift; avoids test->data layer inversion).
- Integrator toggle / energy readout (3-5), time controls (3-6), perturbation slider (later).

## References
- PRD: `docs/specs/phase-3/PRD.md` (section 4 scope — the four preset families)
- Previous retrospective: `docs/checks/phase-3/sub-3-3.md` ("다음 sub-phase(3-4) 교훈")
- Phase 2 store pattern: `docs/specs/phase-2/TECHSPEC.md` (getState in useFrame)
