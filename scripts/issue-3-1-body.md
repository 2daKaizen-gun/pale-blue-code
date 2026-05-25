## Plan
Build the pure-function physics core in `lib/physics/`: a gravitational acceleration function (with softening) and a 4th-order Runge–Kutta integrator step. No rendering — correctness is proven by tests. This is the mathematical backbone: if these are right, Kepler's ellipse emerges on its own (verified in 3-2).

## Lights
- [ ] Add `lib/physics/` + `Body` / `SystemState` types (+ Vector3 helpers if needed) — `feat(nbody): add body data model and physics types`
- [ ] Failing tests for gravitational acceleration (two-body symmetry, direction, magnitude) — `test(nbody): add failing gravity acceleration tests`
- [ ] Implement `computeAccelerations` with softening — `feat(nbody): implement gravitational acceleration with softening`
- [ ] Failing tests for RK4 vs analytic SHO (x'' = −x), O(dt^4) convergence — `test(nbody): add failing RK4 tests vs analytic SHO`
- [ ] Implement `rk4Step` — `feat(nbody): implement RK4 integrator step`
- [ ] Invariant tests (Σ m·a ≈ 0 momentum, softening keeps r→0 finite) — `test(nbody): verify momentum invariant and softening stability`

## Success criteria
- [ ] All `npm run test:run` green
- [ ] Gravity: two-body acceleration magnitude and direction correct; Σ m·a ≈ 0; finite as r→0 (no NaN/Inf)
- [ ] RK4: after one SHO period, position/velocity error < 1e-3; halving dt reduces error ~16× (confirms 4th-order convergence)
- [ ] `npm run build` (tsc) passes
- [ ] Zero visual change (intended — no rendering in this sub-phase)

## Key decisions
- RK4 is verified against an analytic ODE (simple harmonic oscillator) *separately* from gravity. This isolates "is the integrator correct?" from "is gravity correct?" (the latter is 3-2's orbital conservation check). The two bug sources are never mixed.
- 3-1 functions are pure / immutable (state → new state). The ref-based in-place optimization lives in the component layer (3-3), not here — testability first.
- Normalized units: `G` is passed as an argument; tests use `G = 1`.
- Euler integrator is deferred to 3-2 (it is the contrast axis for verification, not part of the RK4 core).
- New dependencies: none. three `Vector3` + vitest only.

## References
- PRD: `docs/specs/phase-3/PRD.md`
- TechSpec: `docs/specs/phase-3/TECHSPEC.md` (§1 decisions, §3 data model, §7 sub-phase split)
- Previous retrospective: `docs/checks/phase-2/sub-2-7.md`
