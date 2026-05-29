import { Vector3 } from 'three'
import type { Body } from '../lib/physics/types'

/**
 * Rendering metadata bolted onto the bare physics `Body`.
 *
 * The physics core (`lib/physics/types.ts`) intentionally knows only
 * mass / position / velocity. id / color / radius / label live here, in
 * the preset layer — the integrator and gravity functions never see
 * them. (See `types.ts` line 18-25.)
 */
export type PresetBody = Body & {
  id: string
  color: string
  /** Visual radius. Physics treats every body as a point mass. */
  radius: number
  label: string
}

export interface Preset {
  /** 3-4 extends to a union: 'two-body' | 'three-body' | 'binary' | 'solar-system' */
  id: 'two-body'
  name: string
  description: string
  /** Gravitational constant in the preset's normalized units. */
  G: number
  /** Suggested fixed dt for the integrator (sim-time per step). */
  recommendedDt: number
  /** Softening ε to prevent the 1/r² blow-up at close approaches. */
  softening: number
  bodies: PresetBody[]
}

/**
 * The exact orbit sub-3-2 conservation-proved.
 *
 * Two equal unit masses on a closed circle about the origin: separation
 * d = 1, each moving at v = √2/2 perpendicular to the separation, giving
 * period T = π√2. Reproduces `circularBinary()` from
 * `lib/physics/two-body.test.ts` (lines 62-67) verbatim. The same dt
 * the test used (ORBIT_T / 600) is the recommended step here, so the
 * 4 conservation certificates (ΔE/E < 1e-3, ΔL/L < 1e-4 over 10 orbits,
 * Kepler T²/a³ consistency, Euler vs RK4 divergence) extend to anything
 * drawn from this preset.
 *
 * Plane: XY. The default three.js camera (+Z → origin) sees this
 * face-on, so no rotation is needed.
 */
const V_CIRC = Math.SQRT2 / 2
const ORBIT_T = Math.PI * Math.SQRT2

export const TWO_BODY: Preset = {
  id: 'two-body',
  name: 'Two-body (verified circular binary)',
  description:
    'Equal-mass binary on a closed circle. The orbit sub-3-2 proved by conservation, drawn directly from F = G·m₁·m₂ / r².',
  G: 1,
  recommendedDt: ORBIT_T / 600,
  softening: 0,
  bodies: [
    {
      id: 'star-a',
      mass: 1,
      position: new Vector3(-0.5, 0, 0),
      velocity: new Vector3(0, -V_CIRC, 0),
      color: '#f5b942', // warm gold
      radius: 0.05,
      label: 'Star A',
    },
    {
      id: 'star-b',
      mass: 1,
      position: new Vector3(0.5, 0, 0),
      velocity: new Vector3(0, V_CIRC, 0),
      color: '#5fb1ff', // cool blue
      radius: 0.05,
      label: 'Star B',
    },
  ],
}
