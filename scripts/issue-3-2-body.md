## Plan
Wire the generic `rk4Step` from 3-1 to `computeAccelerations` to roll a real two-body orbit, then prove the resulting ellipse is a genuine Kepler ellipse via conservation laws. Add `energy.ts` (total energy + angular momentum, pure N-body functions) and an explicit Euler integrator as the contrast axis. No rendering yet — the deliverable is a certificate that the gravity core is physically correct: the safety net for the unsolvable 3-body case later, where orbital divergence is physics (chaos), not a bug, so conservation is the only oracle.

## Lights
- [x] Light 1 — energy.ts: total energy (KE + softened PE), test-first
- [x] Light 2 — energy.ts: total angular momentum L = Σ mᵢ(rᵢ × vᵢ)
- [x] Light 3 — explicit Euler integrator, isolated against SHO (same as 3-1 RK4)
- [x] Light 4 — 2-body RK4 energy conservation (< 0.1%)
- [x] Light 5 — angular momentum conservation (< 0.01%)
- [x] Light 6 — Kepler's third law T²∝a³ (two orbits, different semi-major axes)
- [x] Light 7 — lock Euler divergence as regression (Euler err >> RK4), Closes this issue

## Success criteria
- [x] RK4 two-body: total energy relative error < 0.1% over N orbits
- [x] RK4: angular momentum relative error < 0.01% (central force → exactly conserved)
- [x] Kepler: T²/a³ agrees within 1% across orbits with different semi-major axes
- [x] Euler divergence regression green (Euler err >> RK4 — locks the 3-5 soul moment)
- [x] eulerStep passes SHO isolation test
- [x] `tsc -b` clean, landing bundle unaffected, full suite green

## Key decisions
- Normalized units (G=1, dimensionless): conservation & Kepler are unit-independent; avoids float-scale bugs. Real SI values deferred to render stage (3-3+).
- Explicit (forward) Euler, NOT semi-implicit/symplectic — we deliberately want the leaky one. Symplectic Euler traps energy and never breaks, which would kill the 3-5 soul moment. The divergence is pinned by regression (Light 7).
- Unified integrator signature: `eulerStep(state, dt, accelFn)` === `rk4Step` → integrator becomes a swappable strategy, the foundation for the 3-5 [Euler | RK4] toggle.
- Potential energy uses the SAME softened potential as the force: U = −Σ G·mᵢmⱼ / √(rᵢⱼ² + ε²). Otherwise a perfect integrator still shows energy mismatch at ε>0. The Kepler 2-body check runs at ε=0 for the exact ellipse.
- RK4 is not symplectic → measure conservation over a moderate N-orbit window, not 10⁶ orbits (avoids secular drift false alarms).
- TDD: yes (analytic oracle available, same as 3-1). Euler isolated on SHO before use, mirroring 3-1's RK4 validation.
- Pre-work (lesson from 3-1): `ls lib/physics` / `git status` before writing — confirm rk4Step location, avoid the duplicate-file trap.

## References
- PRD: `docs/specs/phase-3/PRD.md`
- TechSpec: `docs/specs/phase-3/TECHSPEC.md`
- Previous retrospective: `docs/checks/phase-3/sub-3-1.md`