import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import type { SystemState } from './types'
import { computeAccelerations } from './gravity'
import { rk4Step, eulerStep, type AccelFn } from './integrators'
import { totalEnergy, angularMomentum } from './energy'

// Roll `steps` steps of `step` from `state`; return the final state.
function integrate(
  state: SystemState,
  dt: number,
  steps: number,
  step: typeof rk4Step,
  accelOf: AccelFn,
): SystemState {
  let s = state
  for (let i = 0; i < steps; i++) s = step(s, dt, accelOf)
  return s
}

// ───────────────────────── Light 3 ─────────────────────────
// Euler isolated on the harmonic oscillator a = −x (mirrors 3-1's RK4 test):
// verify the integrator BEFORE plugging gravity into it — bug origins stay
// unmixed ("is the integrator right?" vs "is gravity right?").
describe('eulerStep — isolated on the harmonic oscillator a = −x', () => {
  const shoAccel: AccelFn = (s) => s.map((b) => b.position.clone().multiplyScalar(-1))

  it('takes the exact explicit-Euler first step from (x=1, v=0)', () => {
    // x₁ = 1 + 0·dt = 1 ; v₁ = 0 + (−1)·dt = −dt  (uses OLD x, v → explicit)
    const dt = 0.1
    const s0: SystemState = [{ mass: 1, position: new Vector3(1, 0, 0), velocity: new Vector3() }]
    const s1 = eulerStep(s0, dt, shoAccel)
    expect(s1[0].position.x).toBeCloseTo(1, 12)
    expect(s1[0].velocity.x).toBeCloseTo(-dt, 12)
  })

  it('is first-order: halving dt ~halves the error (not ÷16 like RK4)', () => {
    const errAt = (dt: number) => {
      const n = Math.round(1 / dt)
      const s = integrate(
        [{ mass: 1, position: new Vector3(1, 0, 0), velocity: new Vector3() }],
        dt, n, eulerStep, shoAccel,
      )
      return Math.abs(s[0].position.x - Math.cos(1)) // exact x(t) = cos t
    }
    const ratio = errAt(0.01) / errAt(0.005)
    expect(ratio).toBeGreaterThan(1.7)
    expect(ratio).toBeLessThan(2.3)
  })

  it('leaks energy: SHO energy GROWS every step (this is the leak)', () => {
    // explicit Euler on the SHO: E_{n+1} = E_n·(1 + dt²) → monotonic growth.
    const dt = 0.05
    const E = (s: SystemState) => 0.5 * (s[0].position.lengthSq() + s[0].velocity.lengthSq())
    const s0: SystemState = [{ mass: 1, position: new Vector3(1, 0, 0), velocity: new Vector3() }]
    const sN = integrate(s0, dt, 200, eulerStep, shoAccel)
    expect(E(sN)).toBeGreaterThan(E(s0) * 1.2) // grew, didn't hold
  })
})

// A clean bound two-body orbit under gravity (G=1, ε=0):
// equal unit masses on a circular orbit about their common center, momentum
// zero. Relative speed for a circle v_rel = √(G(m₁+m₂)/d) = √2 at d = 1, so
// each body sits at radius 0.5 moving at √2/2. Period T = 2π d / v_rel = π√2.
function circularBinary(): SystemState {
  const v = Math.SQRT2 / 2
  return [
    { mass: 1, position: new Vector3(-0.5, 0, 0), velocity: new Vector3(0, -v, 0) },
    { mass: 1, position: new Vector3(0.5, 0, 0), velocity: new Vector3(0, v, 0) },
  ]
}
const G = 1
const gravity: AccelFn = (s) => computeAccelerations(s, G, 0)
const ORBIT_T = Math.PI * Math.SQRT2

// ───────────────────────── Lights 4, 5 ─────────────────────────
describe('RK4 two-body conservation (the safety net)', () => {
  const dt = ORBIT_T / 600
  const steps = 600 * 10 // 10 orbits

  it("conserves total energy to < 0.1% over 10 orbits", () => {
    const s0 = circularBinary()
    const E0 = totalEnergy(s0, G)
    const EN = totalEnergy(integrate(s0, dt, steps, rk4Step, gravity), G)
    expect(Math.abs((EN - E0) / E0)).toBeLessThan(1e-3)
  })

  it('conserves angular momentum to < 0.01% over 10 orbits', () => {
    const s0 = circularBinary()
    const L0 = angularMomentum(s0).length()
    const LN = angularMomentum(integrate(s0, dt, steps, rk4Step, gravity)).length()
    expect(Math.abs((LN - L0) / L0)).toBeLessThan(1e-4)
  })
})

// ───────────────────────── Light 6 ─────────────────────────
// Kepler's third law T² ∝ a³ — but EMPIRICALLY: we measure both the
// semi-major axis a = (r_min + r_max)/2 and the period T (time for the
// relative-position angle to sweep 2π) straight from the simulation, then
// check T²/a³ agrees across two orbits of different size. No theory baked in
// except the comparison itself — Kepler's law has to *emerge* from F = Gm₁m₂/r².
function measureOrbit(aNominal: number, e: number): { a: number; T: number } {
  const M = 1e6   // heavy "sun" → near fixed-focus Kepler problem
  const m = 1
  const Gl = 1
  const rp = aNominal * (1 - e)
  const vp = Math.sqrt((Gl * (M + m) * (1 + e)) / (aNominal * (1 - e))) // vis-viva at perihelion
  const s0: SystemState = [
    { mass: M, position: new Vector3(0, 0, 0), velocity: new Vector3(0, -(m / M) * vp, 0) }, // recoil → p=0
    { mass: m, position: new Vector3(rp, 0, 0), velocity: new Vector3(0, vp, 0) },
  ]
  const Tapprox = 2 * Math.PI * Math.sqrt(aNominal ** 3 / (Gl * (M + m)))
  const dt = Tapprox / 4000
  const accel: AccelFn = (s) => computeAccelerations(s, Gl, 0)

  let s = s0
  const rel0 = new Vector3().subVectors(s[1].position, s[0].position)
  let rmin = rel0.length()
  let rmax = rel0.length()
  let prevAng = Math.atan2(rel0.y, rel0.x)
  let theta = 0       // unwrapped swept angle
  let prevT = 0
  let period = -1

  for (let i = 1; i <= 6000; i++) {
    s = rk4Step(s, dt, accel)
    const t = i * dt
    const rel = new Vector3().subVectors(s[1].position, s[0].position)
    const r = rel.length()
    if (r < rmin) rmin = r
    if (r > rmax) rmax = r

    const ang = Math.atan2(rel.y, rel.x)
    let d = ang - prevAng
    if (d < -Math.PI) d += 2 * Math.PI
    if (d > Math.PI) d -= 2 * Math.PI
    const next = theta + d
    if (period < 0 && next >= 2 * Math.PI) {
      const frac = (2 * Math.PI - theta) / (next - theta)
      period = prevT + frac * (t - prevT) // interpolate the θ = 2π crossing
    }
    theta = next
    prevAng = ang
    prevT = t
    if (period > 0 && t > period * 1.05) break
  }
  return { a: (rmin + rmax) / 2, T: period }
}

describe("Kepler's third law emerges from the gravity law", () => {
  it('T²/a³ matches across two orbits of different size (within 1%)', () => {
    const o1 = measureOrbit(2, 0.4)
    const o2 = measureOrbit(5, 0.4)
    const k1 = o1.T ** 2 / o1.a ** 3
    const k2 = o2.T ** 2 / o2.a ** 3
    expect(Math.abs((k1 - k2) / k2)).toBeLessThan(0.01)
  })
})

// ───────────────────────── Light 7 ─────────────────────────
// Lock the sub-3-5 "soul" moment as a regression: same orbit, same dt, same
// step count — Euler leaks energy catastrophically while RK4 stays near-flat.
// If a future change "improves" Euler into a symplectic variant, this goes red.
describe('Euler vs RK4 divergence (locks the sub-3-5 soul moment)', () => {
  it('Euler energy error ≫ RK4 over the same 5 orbits', () => {
    const dt = ORBIT_T / 600
    const steps = 600 * 5
    const E0 = totalEnergy(circularBinary(), G)

    const rk4E = totalEnergy(integrate(circularBinary(), dt, steps, rk4Step, gravity), G)
    const eulE = totalEnergy(integrate(circularBinary(), dt, steps, eulerStep, gravity), G)

    const rk4Err = Math.abs((rk4E - E0) / E0)
    const eulErr = Math.abs((eulE - E0) / E0)

    expect(rk4Err).toBeLessThan(1e-3)            // RK4 holds the universe together
    expect(eulErr).toBeGreaterThan(0.05)         // Euler visibly breaks it
    expect(eulErr).toBeGreaterThan(100 * rk4Err) // and is dramatically worse
  })
})
