import { Vector3 } from 'three'
import type { SystemState } from './types'

/**
 * Total mechanical energy E = KE + PE of the N-body system.
 *
 *   KE = Σ_i  ½ mᵢ |vᵢ|²
 *   PE = − Σ_{i<j}  G · mᵢ · mⱼ / √(|rᵢ − rⱼ|² + ε²)
 *
 * The potential uses the SAME softening ε as `computeAccelerations`, so the
 * pair PE is the exact integral of the softened force. Mixing a raw 1/r
 * potential with a softened force would make even a perfect integrator show a
 * spurious energy mismatch at ε > 0. (Two-body Kepler checks run at ε = 0,
 * where this is the exact Newtonian energy.)
 *
 * For a bound orbit E < 0 and is conserved. It is the oracle that separates a
 * correct integrator (energy flat) from a buggy one (energy drifts) — regardless
 * of how wild the orbit looks. That distinction is the whole point in the
 * 3-body case, where a diverging orbit is physics (chaos), not a bug.
 *
 * Pure: never mutates `bodies`.
 */
export function totalEnergy(bodies: SystemState, G: number, softening = 0): number {
  const eps2 = softening * softening

  let kinetic = 0
  for (const b of bodies) {
    kinetic += 0.5 * b.mass * b.velocity.lengthSq()
  }

  let potential = 0
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const rSq = bodies[i].position.distanceToSquared(bodies[j].position) + eps2
      potential -= (G * bodies[i].mass * bodies[j].mass) / Math.sqrt(rSq)
    }
  }

  return kinetic + potential
}

/**
 * Total angular momentum about the origin:  L = Σ_i mᵢ (rᵢ × vᵢ).
 *
 * Gravity is a central force, so torque about the center is zero and L is
 * conserved EXACTLY in the continuous problem — this is Kepler's second law
 * (equal areas in equal times: a planet speeds up at perihelion and slows at
 * aphelion in just the proportion that keeps rᵢ × vᵢ fixed, like a skater
 * pulling their arms in). A good integrator holds L to a far tighter tolerance
 * than energy.
 *
 * Returns the full Vector3 so the conserved direction (the orbital plane's
 * normal) is visible too. Pure.
 */
export function angularMomentum(bodies: SystemState): Vector3 {
  const L = new Vector3()
  for (const b of bodies) {
    L.add(new Vector3().crossVectors(b.position, b.velocity).multiplyScalar(b.mass))
  }
  return L
}
