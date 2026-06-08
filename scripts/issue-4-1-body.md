## Plan

Build the GLSL fullscreen shader scaffold for the black hole scene — no lensing yet.
A fullscreen quad renders a procedural starfield via fragment shader, and the camera matrix
is piped into uniforms so that moving the camera correctly shifts the star positions.
When this works, the geodesic ODE (sub-4-2) can be dropped straight in.

## Lights

**Bundle A — Scene skeleton**
- [ ] `Scene.tsx` + replace `BlackholePage.tsx` placeholder (Canvas + OrbitControls, mirrors Phase 3 pattern)
- [ ] `blackholeStore.ts` — Zustand store with base state: `mass`, `steps`, `diskVisible`, `showHorizon`

**Bundle B — GLSL pipeline**
- [ ] `blackhole.vert.glsl` — NDC fullscreen quad vertex (bypasses camera projection)
- [ ] `blackhole.frag.glsl` — procedural starfield + central black disc (no lensing)
- [ ] `BlackholeRenderer.tsx` — `PlaneGeometry(2,2)` + `ShaderMaterial` (`depthWrite: false`)
- [ ] `UniformUpdater.tsx` — `useFrame` pushes `u_cameraToWorld`, `u_cameraPos`, `u_resolution` each frame
- [ ] Build pass + browser smoke: starfield visible, rotates correctly with OrbitControls

## Success Criteria

- `/blackhole` loads with a procedural starfield and a black disc at center
- Rotating camera via OrbitControls shifts star positions correctly (straight rays, no lensing)
- `npm run build` passes with no type errors

## Key Decisions

| Area | Decision | Reason |
|------|----------|--------|
| Ray generation | NDC → world via `camera.matrixWorld` | Correct perspective without re-implementing projection |
| Starfield | Procedural GLSL (hash-based) | Zero bundle cost; Phase 1 Starfield pattern ported to shader |
| Depth | `depthWrite: false`, `depthTest: false` | Fullscreen quad must not interfere with OrbitControls hit-test |
| GLSL version | GLSL ES 3.0 (`#version 300 es`) | Three.js 0.170 defaults to WebGL2; allows variable-count loops |

## References

- TechSpec §3.1–3.2: vertex shader + ray generation
- TechSpec §3.4: procedural starfield algorithm
- Phase 3 `components/gravity/Scene.tsx` — Canvas pattern to mirror
