import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import type { SystemState } from './types'
import { rk4Step } from './integrators'

// Simple harmonic oscillator: x'' = -x.
// Model it as one body whose acceleration equals -position.
// Analytic solution for x(0)=1, v(0)=0:  x(t)=cos(t), v(t)=-sin(t), period = 2π.
const shoAccel = (s: SystemState): Vector3[] =>
  s.map((b) => b.position.clone().multiplyScalar(-1))

const initial = (): SystemState => [
  { mass: 1, position: new Vector3(1, 0, 0), velocity: new Vector3(0, 0, 0) },
]

function integrate(
  state: SystemState,
  dt: number,
  steps: number,
  accel: (s: SystemState) => Vector3[],
): SystemState {
  let s = state
  for (let i = 0; i < steps; i++) s = rk4Step(s, dt, accel)
  return s
}

describe('rk4Step on a simple harmonic oscillator', () => {
  it('returns to the start after one full period (2π)', () => {
    const dt = (2 * Math.PI) / 1000
    const final = integrate(initial(), dt, 1000, shoAccel)
    expect(final[0].position.x).toBeCloseTo(1, 3) // cos(2π)=1
    expect(final[0].velocity.x).toBeCloseTo(0, 3) // -sin(2π)=0
  })

  it('matches the analytic solution mid-flight (t = π/2)', () => {
    const steps = 1000
    const dt = Math.PI / 2 / steps
    const final = integrate(initial(), dt, steps, shoAccel)
    expect(final[0].position.x).toBeCloseTo(0, 3) // cos(π/2)=0
    expect(final[0].velocity.x).toBeCloseTo(-1, 3) // -sin(π/2)=-1
  })

  it('is 4th-order: halving dt cuts the error ~16x', () => {
    const T = 2 * Math.PI
    const errorAt = (steps: number) => {
      const final = integrate(initial(), T / steps, steps, shoAccel)
      return Math.hypot(final[0].position.x - 1, final[0].velocity.x - 0)
    }
    const ratio = errorAt(50) / errorAt(100) // dt halved
    // 4th order → error ∝ dt⁴ → ratio ≈ 2⁴ = 16
    expect(ratio).toBeGreaterThan(10)
    expect(ratio).toBeLessThan(24)
  })

  it('does not mutate the input state (pure function)', () => {
    const s = initial()
    rk4Step(s, 0.01, shoAccel)
    expect(s[0].position.x).toBe(1)
    expect(s[0].velocity.x).toBe(0)
  })
})
