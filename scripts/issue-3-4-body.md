## Plan
Introduce the preset selector — the first real stage for `gravityStore`.
Until 3-3 the scene ran on a single hard-coded system (`useRef` + inline
constants). 3-4 lets the visitor switch between preset systems (two-body
elliptical, two-body circular, three-body figure-8, binary, solar-system
N-body) from a UI panel outside the Canvas, while the Canvas reads the same
truth via the store. Preset switching remounts trails via React `key`.

## Lights
- [ ] Light 1 — Add `camera` field to `Preset` interface; migrate existing TWO_BODY / TWO_BODY_CIRCULAR (refactor, no behavior change)
- [ ] Light 2 — Add three-body figure-8 preset (published initial conditions)
- [ ] Light 3 — Add binary-star preset
- [ ] Light 4 — Extend `planets.ts` with mass; add solar-system N-body preset
- [ ] Light 5 — Create `gravityStore` (Zustand): `presetId` + `selectPreset`
- [ ] Light 6 — Build `PresetSelector` panel (keyboard accessible, `aria-pressed`)
- [ ] Light 7 — Drive Scene from selected preset: camera from preset, `<Trails key={presetId} />`, Bodies/Trails read store

## Success criteria
- [ ] Selecting any preset loads clean initial conditions (Phase 2 reset spirit)
- [ ] Preset switch remounts trails — no stale ring-buffer points carried over
- [ ] Camera framing correct per preset (two-body ~units vs solar ~tens of AU)
- [ ] Figure-8 stays an "8" indefinitely when untouched (regression guard)
- [ ] Solar-system preset feels like a Phase 2 revisit (continuity)
- [ ] `gravityStore` read via `getState()` inside `useFrame` — zero per-frame re-renders (Phase 2 paradigm)

## Key decisions
- `gravityStore` (Zustand) is introduced here: selector UI (outside Canvas) and refs (inside Canvas) must share one truth — Phase 2 store pattern
- Preset switch = parent `key={presetId}` remount -> clean geometry/material dispose + fresh ring-buffer; folds the current `n`-based useMemo into the key
- `camera` moves onto the `Preset` interface — 3-3's inline `[0, 0, 3]` breaks once solar-system (tens of AU) becomes a preset
- TWO_BODY (asymmetric, e=0.3) stays the visual default; TWO_BODY_CIRCULAR (equal-mass circle) is exposed as the "mathematically clean" option — presets double as learning slides

## References
- PRD: `docs/specs/phase-3/PRD.md` (§4 scope — the four preset families)
- Previous retrospective: `docs/checks/phase-3/sub-3-3.md` ("다음 sub-phase(3-4) 교훈")
- Phase 2 store pattern: `docs/specs/phase-2/TECHSPEC.md` (getState in useFrame)
