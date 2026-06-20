## Plan

Add Schwarzschild null geodesic integration (u–φ ODE, GLSL RK4) to the fullscreen shader,
replacing the static black disc placeholder with per-pixel light bending. A photon traced
backward from the camera through the curved spacetime gives the deflected direction used to
sample the starfield — producing the Einstein ring and gravitational lensing effect.
Wire mass/steps/horizon controls via ControlPanel so the user can feel the physics.

## Lights

**Bundle A — GLSL geodesic math**
- [x] `geodesicDerivs(state, rs)` + `rk4Step(state, dphi, rs)` — pure GLSL math functions
- [x] `traceRay(rd)` — orbital plane setup (e_r, e_t, n), initial conditions (u0, p0, b),
      MAX_STEPS loop with event-horizon early-exit, final direction reconstruction
- [x] Wire `traceRay` into `main()`, replace disc placeholder → `starfield(traceRay(rd))`
- [x] Adjust Scene camera distance + mass default scale for visible Einstein ring
- [x] Verify: u_rs=0 matches 4-1 baseline; u_rs>0 produces lensing ring

**Bundle B — Controls**
- [x] `ControlPanel.tsx` — mass slider (0.3–3.0), steps toggle (64/96/128), horizon toggle
- [x] Wire ControlPanel into `Scene.tsx` (Canvas 밖, fixed bottom, absolute positioning)
- [x] Update `UniformUpdater` to push `u_steps` + `u_showHorizon` each frame

## Success Criteria

- Einstein ring visible when looking directly at BH (photon sphere light ring)
- Mass slider moving right visibly expands the lensed region
- Steps toggle 64 → 128 shows sharper ring; 64 → low value (if tested) breaks the ring
- `u_rs = 0` render identical to sub-4-1 baseline (no lensing)
- Event horizon pixels are black (photons that enter r < r_s)
- `npm run build` passes with no type errors

## Key Decisions

| Area | Decision | Reason |
|------|----------|--------|
| ODE | u–φ Binet equation (2D orbital plane) | GR-exact, GLSL state = 2 floats; 3D Cartesian needs 6 |
| Loop | `for(int i=0;i<MAX_STEPS;i++){ if(i>=u_steps) break; }` | Driver compatibility (some require compile-time constant) |
| Step size | `dφ = 0.1` (≈ 5.7°) | Covers 6.4 rad (64 steps) — enough for one full orbit of near-photon-sphere photons |
| Camera scale | Adjust if r/r_s < 5 at default mass | Einstein ring requires camera to be several r_s away |
| Event horizon | `if (1.0/u < u_rs) return black;` inside loop | Photons inside horizon cannot escape |

## References

- TechSpec §3.3: Schwarzschild geodesic + GLSL RK4
- TechSpec §7: loop driver compatibility warning
- sub-4-1 Check: "r_s=0 straight line test before enabling lensing"
- PRD §3: 60s scenario — Einstein ring moment as the centrepiece
