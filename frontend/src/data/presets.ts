import { Vector3 } from 'three'
import type { Body } from '../lib/physics/types'

/**
 * Rendering metadata bolted onto the bare physics `Body`.
 *
 * The physics core (`lib/physics/types.ts`) intentionally knows only
 * mass / position / velocity. id / color / radius / label live here,
 * in the preset layer — the integrator and gravity functions never
 * see them. (See `types.ts` line 18-25.)
 */
export type PresetBody = Body & {
  id: string
  color: string
  /** Visual radius. Physics treats every body as a point mass. */
  radius: number
  label: string
}

export interface Preset {
  /** 3-4 extends to a union: 'two-body' | 'two-body-circular' | 'three-body' | 'binary' | 'solar-system' */
  id: 'two-body' | 'two-body-circular'
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

// ───────────────────────────────────────────────────────────
// TWO_BODY — the headline scene of sub-3-3.
//
// An *asymmetric* two-body in an elliptical orbit (e = 0.3). Picked
// over the symmetric circular case for three reasons:
//
//   1. The two bodies trace *visibly different* curves (a small inner
//      orbit for the heavy star, a large outer one for the light star
//      — both around their common barycenter at the origin). Symmetric
//      equal-mass circles overlap into a single ring, which both hid
//      one trail behind the other and erased the per-body identity.
//
//   2. With nonzero eccentricity, dt-spaced trail points are *denser
//      near aphelion (slow) and sparser near perihelion (fast)* —
//      Kepler's 2nd law made visible as dot density. sub-3-2 proved
//      L conservation to 10 digits; this preset *shows* that proof.
//
//   3. It mirrors the PRD §3 "Sun–Earth ellipse" framing and the
//      project's own metaphor — "Pale Blue Dot" — far more directly
//      than a clean equal-mass ring.
//
// The symmetric circular orbit sub-3-2 verified is *not lost* — it
// lives below as `TWO_BODY_CIRCULAR` for reuse / regression demos.
//
// Numbers (G = 1, total separation at perihelion = 0.7, a = 1):
//   m_A = 5 (sun-like), m_B = 1 (earth-like)
//   Total mass M = 6 → T = 2π/√6 ≈ 2.565
//   r_p = a(1-e) = 0.7 → v_p = √(GM(1+e)/r_p) ≈ 3.339
//   Each body's distance / velocity scales by the *other's* mass fraction
//   so the barycenter sits at the origin with zero net momentum:
//     A: r = -r_p · (m_B/M),  v = -v_p · (m_B/M)
//     B: r = +r_p · (m_A/M),  v = +v_p · (m_A/M)
// ───────────────────────────────────────────────────────────

const M_A = 5
const M_B = 1
const M_TOT = M_A + M_B
const A_AXIS = 1 // semi-major axis (of the relative orbit)
const E_ECC = 0.3
const G_CONST = 1
const R_P = A_AXIS * (1 - E_ECC) // 0.7 — perihelion separation
const V_P = Math.sqrt((G_CONST * M_TOT * (1 + E_ECC)) / R_P) // vis-viva
const T_ORBIT = 2 * Math.PI * Math.sqrt(A_AXIS ** 3 / (G_CONST * M_TOT))

export const TWO_BODY: Preset = {
  id: 'two-body',
  name: 'Two-body (asymmetric, e = 0.3)',
  description:
    'A heavy star and a light companion on an elliptical orbit about their common barycenter. The shape of Kepler that emerges from F = G·m₁·m₂ / r².',
  G: G_CONST,
  recommendedDt: T_ORBIT / 600,
  softening: 0,
  bodies: [
    {
      id: 'star-a',
      mass: M_A,
      position: new Vector3(-R_P * (M_B / M_TOT), 0, 0),
      velocity: new Vector3(0, -V_P * (M_B / M_TOT), 0),
      color: '#fff1c2', // warm sunlike
      radius: 0.08,
      label: 'Star A',
    },
    {
      id: 'star-b',
      mass: M_B,
      position: new Vector3(R_P * (M_A / M_TOT), 0, 0),
      velocity: new Vector3(0, V_P * (M_A / M_TOT), 0),
      color: '#7ec8ff', // pale blue
      radius: 0.04,
      label: 'Star B',
    },
  ],
}

// ───────────────────────────────────────────────────────────
// TWO_BODY_CIRCULAR — the exact orbit sub-3-2 conservation-proved.
//
// Two equal unit masses on a closed circle about the origin:
// separation d = 1, each moving at v = √2/2 perpendicular to the
// separation, giving period T = π√2. Reproduces `circularBinary()`
// from `lib/physics/two-body.test.ts` (lines 62-67) verbatim.
//
// Kept as a separate export so the test fixture remains in canonical
// form (single source of truth for the certificates) and the demo
// scene can use the more visually expressive asymmetric case above.
// 3-4 will let users switch between them via the preset selector.
// ───────────────────────────────────────────────────────────

const V_CIRC = Math.SQRT2 / 2
const T_CIRC = Math.PI * Math.SQRT2

export const TWO_BODY_CIRCULAR: Preset = {
  id: 'two-body-circular',
  name: 'Two-body (verified circular binary)',
  description:
    'Equal-mass binary on a closed circle — the orbit sub-3-2 proved by conservation. The mathematically clean case.',
  G: 1,
  recommendedDt: T_CIRC / 600,
  softening: 0,
  bodies: [
    {
      id: 'star-a',
      mass: 1,
      position: new Vector3(-0.5, 0, 0),
      velocity: new Vector3(0, -V_CIRC, 0),
      color: '#f5b942',
      radius: 0.05,
      label: 'Star A',
    },
    {
      id: 'star-b',
      mass: 1,
      position: new Vector3(0.5, 0, 0),
      velocity: new Vector3(0, V_CIRC, 0),
      color: '#5fb1ff',
      radius: 0.05,
      label: 'Star B',
    },
  ],
}
