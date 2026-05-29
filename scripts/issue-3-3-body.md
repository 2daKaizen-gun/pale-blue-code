## Plan
First visualization layer for Phase 3. Render the verified two-body orbit
on screen using the useFrame mass-render paradigm from Phase 2 (zero
setState, ref-to-mesh writes), now applied to *actual integration state*.
Build the thin in-place adapter wrapping the verified pure RK4 core
(never touch the core). Draw fade-out trails via a fixed-length ring
buffer. Integrator toggle, presets selector, energy readout, and time
controls are deferred to 3-4/3-5/3-6.

## Lights
- [ ] Light 1 - Wrap pure `rk4Step` in an in-place adapter `(bodies, dt, G, eps) => void`, with an equivalence test vs the pure core
- [ ] Light 2 - Add minimal `data/presets.ts` two-body entry (reuse sub-3-2 verified initial condition)
- [ ] Light 3 - Add `components/gravity/Scene.tsx` (Phase 2 canvas pattern: dpr cap, inner Suspense, dev guard)
- [ ] Light 4 - Add `<Bodies>` reading `bodiesRef` and writing mesh positions each frame
- [ ] Light 5 - Add `<Integrator>` with a fixed-dt substep loop (RK4 fixed; store wiring deferred)
- [ ] Light 6 - Add a fixed-length ring buffer util (TDD: push/wrap/read)
- [ ] Light 7 - Add `<Trails>` fade-out line via BufferGeometry
- [ ] Light 8 - Fill `GravityPage` stub + lazy route (Phase 2 code-split pattern)
- [ ] Light 9 - Sync TechSpec §3: mark `Integrator` type as the 3-3 render wrapper

## Success criteria
- [ ] `/gravity` shows two bodies moving under RK4 with a drawn elliptical trail
- [ ] In-place adapter is numerically identical to pure `rk4Step` (auto test)
- [ ] Ring buffer unit tests pass (fixed length, correct wrap)
- [ ] Zero setState per frame (mass-render verified)
- [ ] 60fps maintained on desktop (Phase 2 gate)
- [ ] `/gravity` ships as a code-split chunk

## Key decisions
- In-place adapter wraps, never edits, the verified pure core (sub-3-2 contract is ground truth)
- Physics state lives in a ref; store deferred to 3-4 (init on mount for now)
- RK4 fixed in 3-3; integrator toggle is 3-5
- Trails use a fixed-length ring buffer (zero GC pressure)

## References
- PRD: `docs/specs/phase-3/PRD.md`
- TechSpec: `docs/specs/phase-3/TECHSPEC.md` (§2 line 97 pure sig, §3 in-place type)
- Previous retrospective: `docs/checks/phase-3/sub-3-2.md`
