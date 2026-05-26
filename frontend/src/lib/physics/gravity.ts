import { Vector3 } from 'three'
import type { SystemState } from './types'

/**
 * Newtonian gravitational acceleration on each body from every other body.
 *
 *   a_i = Σ_{j≠i}  G · m_j · (r_j − r_i) / (|r_j − r_i|² + ε²)^(3/2)
 *
 * Note what is NOT in the formula: the accelerated body's own mass m_i.
 * Gravitational acceleration is independent of the falling body's mass —
 * Galileo's feather and hammer. (The *force* scales with m_i, but a = F/m_i
 * cancels it.)
 *
 * `softening` (ε) prevents the 1/r² blow-up when two bodies get very close:
 * the denominator never reaches zero, so accelerations stay finite. ε = 0
 * gives exact Newtonian gravity (and NaN if two bodies coincide).
 *
 * Pure: never mutates `bodies`; returns fresh Vector3 instances.
 */
export function computeAccelerations(
  bodies: SystemState,
  G: number,
  softening = 0,
): Vector3[] {
  const eps2 = softening * softening

  return bodies.map((bi, i) => {
    const acc = new Vector3()

    for (let j = 0; j < bodies.length; j++) {
      if (j === i) continue
      const bj = bodies[j]

      // d = r_j − r_i  (points from body i toward body j → attraction)
      const d = new Vector3().subVectors(bj.position, bi.position)
      const distSq = d.lengthSq() + eps2
      const invDistCubed = 1 / Math.pow(distSq, 1.5)

      // a_i += G · m_j · d / (|d|² + ε²)^(3/2)
      acc.addScaledVector(d, G * bj.mass * invDistCubed)
    }

    return acc
  })
}
