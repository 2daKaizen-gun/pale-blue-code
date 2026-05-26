import { Vector3 } from 'three'
import type { SystemState } from './types'

/** Acceleration field: given a system, return each body's acceleration. */
export type AccelFn = (state: SystemState) => Vector3[]

/**
 * One 4th-order Runge–Kutta step for a Newtonian system.
 *
 * We integrate the coupled first-order system
 *     dx/dt = v
 *     dv/dt = a(x)
 * where `a` is supplied by `accelOf` (Newtonian gravity in 3-2+, or any
 * analytic field like the SHO `a = -x` used to verify the integrator).
 *
 * RK4 samples the slope four times per step and blends them
 * (k1 + 2k2 + 2k3 + k4)/6, giving O(dt⁴) global error — halving dt cuts
 * the error ~16×. That accuracy is the whole point: a 1st-order Euler step
 * leaks energy and spirals a stable orbit apart (the Phase 3 "soul" demo,
 * sub-3-5), while RK4 keeps it closed over the demo's timescale.
 *
 * Pure: `state` is never mutated; a new SystemState with fresh vectors
 * is returned.
 */
export function rk4Step(state: SystemState, dt: number, accelOf: AccelFn): SystemState {
  const x0 = state.map((b) => b.position.clone())
  const v0 = state.map((b) => b.velocity.clone())

  // Build a probe state at shifted positions (masses kept; velocities
  // irrelevant to a position-only acceleration field).
  const probe = (positions: Vector3[]): SystemState =>
    state.map((b, i) => ({ mass: b.mass, position: positions[i], velocity: b.velocity }))

  // base[i] + s · delta[i]   (returns fresh vectors)
  const step = (base: Vector3[], delta: Vector3[], s: number): Vector3[] =>
    base.map((p, i) => p.clone().addScaledVector(delta[i], s))

  // k1: slope at the start
  const k1x = v0
  const k1v = accelOf(probe(x0))

  // k2: slope at the midpoint, using k1
  const k2x = step(v0, k1v, dt / 2)
  const k2v = accelOf(probe(step(x0, k1x, dt / 2)))

  // k3: slope at the midpoint, refined with k2
  const k3x = step(v0, k2v, dt / 2)
  const k3v = accelOf(probe(step(x0, k2x, dt / 2)))

  // k4: slope at the end, using k3
  const k4x = step(v0, k3v, dt)
  const k4v = accelOf(probe(step(x0, k3x, dt)))

  // weighted blend: Δ = dt/6 · (k1 + 2k2 + 2k3 + k4)
  const blend = (a: Vector3[], b: Vector3[], c: Vector3[], d: Vector3[]): Vector3[] =>
    a.map((_, i) =>
      new Vector3()
        .addScaledVector(a[i], 1)
        .addScaledVector(b[i], 2)
        .addScaledVector(c[i], 2)
        .addScaledVector(d[i], 1)
        .multiplyScalar(dt / 6),
    )

  const dx = blend(k1x, k2x, k3x, k4x)
  const dv = blend(k1v, k2v, k3v, k4v)

  return state.map((b, i) => ({
    mass: b.mass,
    position: x0[i].clone().add(dx[i]),
    velocity: v0[i].clone().add(dv[i]),
  }))
}
