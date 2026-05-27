import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import type { SystemState } from './types'
import { computeAccelerations } from './gravity'
import { rk4Step } from './integrators'

// First time gravity + RK4 run together: a smoke test that the pieces
// COMPOSE. Full analytic orbit verification (energy, Kepler T²∝a³, ellipse
// shape) lives in sub-3-2 — here we only confirm the assembled system is
// stable and obeys the conservation law that one step already guarantees
// (Σ m·a = 0 → total momentum constant).

describe('gravity + RK4 integration (smoke)', () => {
  const G = 1
  const accel = (s: SystemState) => computeAccelerations(s, G, 0.01)

  // Two equal masses with equal-and-opposite momentum → total p = 0.
  // Perpendicular speed below circular → a bound elliptical orbit.
  const twoBody = (): SystemState => [
    { mass: 1, position: new Vector3(-1, 0, 0), velocity: new Vector3(0, -0.3, 0) },
    { mass: 1, position: new Vector3(1, 0, 0), velocity: new Vector3(0, 0.3, 0) },
  ]

  const totalMomentum = (s: SystemState) =>
    s.reduce((acc, b) => acc.addScaledVector(b.velocity, b.mass), new Vector3())

  it('conserves total momentum over thousands of steps', () => {
    let s = twoBody()
    const p0 = totalMomentum(s)
    for (let i = 0; i < 2000; i++) s = rk4Step(s, 0.005, accel)
    const p1 = totalMomentum(s)
    expect(p1.x).toBeCloseTo(p0.x, 6)
    expect(p1.y).toBeCloseTo(p0.y, 6)
    expect(p1.z).toBeCloseTo(p0.z, 6)
  })

  it('stays finite (no NaN/Inf) over a long run', () => {
    let s = twoBody()
    for (let i = 0; i < 5000; i++) s = rk4Step(s, 0.005, accel)
    for (const b of s) {
      expect(Number.isFinite(b.position.x)).toBe(true)
      expect(Number.isFinite(b.velocity.y)).toBe(true)
    }
  })

  it('keeps a bound orbit bounded (does not fly apart)', () => {
    let s = twoBody()
    let maxSeparation = 0
    for (let i = 0; i < 2000; i++) {
      s = rk4Step(s, 0.005, accel)
      maxSeparation = Math.max(maxSeparation, s[0].position.distanceTo(s[1].position))
    }
    expect(maxSeparation).toBeLessThan(5) // bound ellipse, never escapes
  })
})
