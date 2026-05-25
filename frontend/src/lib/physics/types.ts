import type { Vector3 } from 'three'

/**
 * A body as the physics core sees it: just mass, position, velocity.
 *
 * Rendering metadata (id, color, radius, label) is intentionally NOT here —
 * the integrator and gravity functions don't care what a body looks like,
 * only how heavy it is, where it is, and how fast it moves. Preset/scene
 * layers (sub-3-4) extend this with render fields.
 *
 * Units are normalized: see `data/presets.ts`. `G` is always passed in,
 * never assumed (tests use G = 1).
 */
export interface Body {
  /** Mass in the preset's normalized unit. */
  mass: number
  /** Position vector. */
  position: Vector3
  /** Velocity vector. */
  velocity: Vector3
}

/**
 * The full N-body system the integrator advances.
 *
 * Physics functions in this module are pure: they read a SystemState and
 * return a NEW SystemState (with fresh Vector3 instances) rather than
 * mutating the input. The mutable, ref-based in-place optimization lives
 * in the component layer (sub-3-3), not here.
 */
export type SystemState = Body[]
