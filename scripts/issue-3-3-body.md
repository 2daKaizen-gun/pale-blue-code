## Plan
First visualization layer for Phase 3. Render the verified two-body orbit
using the useFrame mass-render paradigm from Phase 2 (zero setState, ref
writes), now applied to *actual integration state*. The pure RK4 core
verified in sub-3-2 is called as-is via ref replacement
(`bodiesRef.current = rk4Step(...)`) — no in-place mutation adapter is
built, because inspection of the real `lib/physics/*.ts` shows the
adapter would require rewriting the verified core. Trails draw via a
fixed-length ring buffer. Integrator toggle, presets selector, energy
readout, and time controls are deferred to 3-4 / 3-5 / 3-6.

## Lights
- [ ] Light 1 - Add `data/presets.ts` with the two-body entry (sub-3-2 verified initial condition) and inline `Preset` / `PresetBody` types
- [ ] Light 2 - Add `components/gravity/Scene.tsx` (Phase 2 canvas pattern: dpr cap, inner Suspense, OrbitControls, Stars) and wire `GravityPage` with a lazy route
- [ ] Light 3 - Add `<Bodies>` reading `bodiesRef` and writing mesh positions each frame (static verify first)
- [ ] Light 4 - Add `<Integrator>` with a fixed-dt substep loop (RK4 fixed, ref replacement, `AccelFn` via `useMemo`)
- [ ] Light 5 - Add a fixed-length ring buffer util in `lib/util/` (TDD: push, wrap, read)
- [ ] Light 6 - Add `<Trails>` fade-out line via `BufferGeometry`, consuming the ring buffer
- [ ] Light 7 - Sync TechSpec §3: `Integrator` type matches the actual pure signature; "mutable ref" reworded as ref-replacement

## Success criteria
- [ ] `/gravity` shows two bodies moving under RK4 with a drawn elliptical trail
- [ ] Pure `rk4Step` and `computeAccelerations` are not modified (sub-3-2 verification holds)
- [ ] Ring buffer unit tests pass (fixed length, correct wrap)
- [ ] Zero setState per frame (mass-render verified)
- [ ] 60fps maintained on desktop (Phase 2 gate)
- [ ] `/gravity` ships as a code-split chunk
- [ ] TechSpec §3 ↔ actual `.ts` are aligned (closes the flag from sub-3-2)

## Key decisions
- Ref replacement, not in-place mutation: inspection of the real
  integrators showed the pure core returns a fresh `SystemState` per
  step. Wrapping it in true in-place writes would require rewriting the
  verified core, which sub-3-2 forbids. React mass-render is guaranteed
  by ref replacement alone; Vector3 GC pressure is deferred until
  measured (sub-2-7 "measure-first" principle).
- RK4 fixed; no store in 3-3. `timeSpeed` / `paused` / integrator
  toggle are compile-time constants here, swapped for store reads in
  3-5 / 3-6 (additive, no rip-out).
- `data/presets.ts` is born minimal with the two-body entry only. 3-4
  expands to three-body / binary / solar-system and adds the selector
  + `planets.ts` mass field.
- `AccelFn` is a one-line `useMemo` inside `<Integrator>`, not a
  separate module. YAGNI.

## References
- PRD: `docs/specs/phase-3/PRD.md`
- TechSpec: `docs/specs/phase-3/TECHSPEC.md` (§2 architecture, §3 integrator type to be synced in Light 7)
- Previous retrospective: `docs/checks/phase-3/sub-3-2.md` (sub-3-1 contract, ref-replacement rationale)
- Verified pure core: `frontend/src/lib/physics/{integrators.ts,gravity.ts,types.ts}`
