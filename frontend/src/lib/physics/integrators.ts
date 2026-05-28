import { Vector3 } from 'three'
import type { SystemState } from './types'

/** Acceleration field: given a system, return each body's acceleration. */
export type AccelFn = (state: SystemState) => Vector3[]

export function rk4Step(state: SystemState, dt: number, accelOf: AccelFn): SystemState {
  const x0 = state.map((b) => b.position.clone())
  const v0 = state.map((b) => b.velocity.clone())

  const probe = (positions: Vector3[]): SystemState =>
    state.map((b, i) => ({ mass: b.mass, position: positions[i], velocity: b.velocity }))

  const step = (base: Vector3[], delta: Vector3[], s: number): Vector3[] =>
    base.map((p, i) => p.clone().addScaledVector(delta[i], s))

  const k1x = v0
  const k1v = accelOf(probe(x0))

  const k2x = step(v0, k1v, dt / 2)
  const k2v = accelOf(probe(step(x0, k1x, dt / 2)))

  const k3x = step(v0, k2v, dt / 2)
  const k3v = accelOf(probe(step(x0, k2x, dt / 2)))

  const k4x = step(v0, k3v, dt)
  const k4v = accelOf(probe(step(x0, k3x, dt)))

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

/**
 * One step of EXPLICIT (forward) Euler — deliberately the "bad" integrator.
 *
 *   x_{n+1} = x_n + v_n · dt
 *   v_{n+1} = v_n + a(x_n) · dt
 *
 * Both updates read the OLD state (x_n, v_n). That is what makes it leak: each
 * step follows the tangent line and overshoots the curving orbit slightly
 * outward, pumping energy in every step (for the SHO, E grows by exactly a
 * factor (1 + dt²) per step). A stable orbit spirals open and the body flies
 * off — the Phase 3 "soul" demo (sub-3-5): same law, wrong method, broken
 * universe.
 *
 * We do NOT use semi-implicit / symplectic Euler (which would update x with the
 * NEW velocity v_{n+1}); that variant nearly conserves energy and would never
 * break — killing the demo. The divergence is the point, and is pinned by a
 * regression test (sub-3-2) so a future "optimization" can't silently fix it.
 *
 * Same signature as `rk4Step`, so the integrator is a swappable strategy
 * (the [Euler | RK4] toggle of sub-3-5). Pure.
 */
export function eulerStep(state: SystemState, dt: number, accelOf: AccelFn): SystemState {
  const acc = accelOf(state)
  return state.map((b, i) => ({
    mass: b.mass,
    position: b.position.clone().addScaledVector(b.velocity, dt),
    velocity: b.velocity.clone().addScaledVector(acc[i], dt),
  }))
}
