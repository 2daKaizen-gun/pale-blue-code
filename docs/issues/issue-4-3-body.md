## Plan

Add an accretion disk to the Schwarzschild ray-marcher: detect equatorial-plane crossings
inside the RK4 loop, color the disk with a temperature gradient, and animate Doppler beaming
so the approaching side appears bluer and brighter while the receding side fades to red.
Tilt the camera slightly off the equatorial plane so the disk is visible as a surface rather
than a thin edge, and finish the Phase with mobile DPR optimisation, Lighthouse check, and
the Phase 4 handoff document.

## Lights

**Bundle A — Disk rendering infrastructure**
- [x] `BlackholeRenderer.tsx` + `UniformUpdater.tsx` — add `u_diskVisible`, `u_diskInner`,
      `u_diskOuter` uniforms; wire from store (`diskVisible`, `mass*6` outer, `mass*6` ISCO);
      move camera to `(0, 4, 20)` in `Scene.tsx` (~11° inclination above equatorial plane)

**Bundle B — GLSL disk geometry**
- [x] Extend `traceRay(rd, out float diskR, out float diskDoppler)` — track 3D position
      `pos = (1/u)*(e_r·cosφ + e_t·sinφ)`, detect sign change of `pos.y` (y=0 crossing),
      record `diskR = length(pos.xz)` if `diskR ∈ [u_diskInner, u_diskOuter]`
- [x] Add `diskColor(r, doppler)` — temperature gradient (white-yellow inner → orange outer);
      `diskDoppler = 0.5` (neutral) for now; wire into `main()` as `diskR > 0` branch

**Bundle C — Doppler beaming**
- [x] Compute Doppler inside `traceRay`: `v_tangential = normalize(vec3(-hit.z, 0, hit.x))`
      (prograde), `v_los = dot(v_tangential, normalize(u_cameraPos − hit))`,
      `diskDoppler = clamp(v_los / sqrt(r_hit) * 3.0 + 0.5, 0.0, 1.0)`
- [x] Update `diskColor` to use `diskDoppler`: blue+bright (≈1) ↔ red+dim (≈0)

**Bundle D — UI + mobile**
- [x] `ControlPanel.tsx` — add Disk toggle button (matches Horizon button pattern)
- [x] `Scene.tsx` — `useIsTouchDevice` → `dpr={isMobile ? [1, 1.5] : [1, 2]}`

**Bundle E — Quality gate**
- [x] `npm run build` — confirm no TS errors and chunk sizes unchanged
- [x] Lighthouse `/blackhole` ≥ 85 Performance (BlackholePage already lazy-loaded from sub-2-7)

**Bundle F — Phase close**
- [x] `docs/checks/phase-4/sub-4-3.md` — Test + Check retrospective
- [x] `docs/phase-handoffs/phase-4-to-5.md` — Phase 4 → 5 handoff

## Success Criteria

- [x] `diskVisible` on: accretion disk visible on equatorial plane, both near side and lensed far
      side (gravitational lensing curves far disk over the top of the BH)
- [x] Doppler beaming: one side is bluer/brighter, opposite is redder/dimmer as camera orbits
- [x] Mass slider: `r_isco` and `r_outer` scale with `r_s`, disk grows/shrinks accordingly
- [x] Disk toggle button works; default state is off
- [x] Camera at (0, 4, 20): disk visible as a surface, not edge-on
- [x] `npm run build` passes
- [x] Lighthouse Performance `/blackhole` ≥ 85

## Key Decisions

| Area | Decision | Reason |
|------|----------|--------|
| Disk detection | Inside RK4 loop — sign change of `pos_3d.y` | TechSpec §3.5 "detect inside ray-marcher"; physically correct vs. straight-line plane intersect approximation |
| `traceRay` signature | Add `out float diskR, out float diskDoppler` | GLSL ES 3.0 supports `out` parameters; keeps disk logic self-contained |
| Doppler | Non-relativistic Keplerian `v ∝ 1/√r` | TechSpec §6: "visual effect first, non-relativistic approximation acceptable" |
| Camera tilt | (0, 0, 15) → (0, 4, 20) | Camera at y=0 sees disk edge-on; 11° tilt exposes disk face + lensed far side |
| Mobile | `dpr [1,1.5]` on touch device | Reduces GPU pixel fill rate; steps already at 64 (minimum) |
| Lighthouse | Lazy-load already done (sub-2-7) | No additional code split needed; just verify score |

## References

- PRD §4: accretion disk (4-3 scope)
- TechSpec §3.5: disk ray-plane intersection sketch
- TechSpec §6: known limits — non-relativistic Doppler approximation
- sub-4-2 Check: camera distance / r_s scale lessons; `bhMaterialRef` singleton note
- `docs/specs/phase-4/PRD.md`, `docs/specs/phase-4/TECHSPEC.md`
