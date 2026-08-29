import { Vector3 } from 'three'
import type { Body } from '../lib/physics/types'
import { PLANETS, type PlanetId } from './planets'
import { SUN } from './sun'

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

/**
 * Camera framing per preset (sub-3-4).
 *
 * 3-3 hard-coded the camera at `[0, 0, 3]` with far=100 / OrbitControls
 * 0.5–20, which is right for a ~unit-scale two-body but *breaks* once a
 * preset spans tens of AU (solar system). Each preset now carries its
 * own framing; the Scene reads it instead of an inline constant.
 */
export interface CameraConfig {
  position: [number, number, number]
  far: number
  minDistance: number
  maxDistance: number
}

export type PresetId =
  | 'two-body'
  | 'two-body-circular'
  | 'three-body'
  | 'binary'
  | 'solar-system'

export interface Preset {
  id: PresetId
  name: string
  description: string
  /** Gravitational constant in the preset's normalized units. */
  G: number
  /** Suggested fixed dt for the integrator (sim-time per step). */
  recommendedDt: number
  /** Softening ε to prevent the 1/r² blow-up at close approaches. */
  softening: number
  /** Camera framing for this system's spatial scale (sub-3-4). */
  camera: CameraConfig
  bodies: PresetBody[]
}

// ───────────────────────────────────────────────────────────
// TWO_BODY — the headline scene of sub-3-3.
// Asymmetric elliptical (e = 0.3) about the barycenter at the origin.
// (Full rationale: see sub-3-3 retrospective.)
//   m_A = 5 (sun-like), m_B = 1 (earth-like), G = 1, a = 1
// ───────────────────────────────────────────────────────────
const M_A = 5
const M_B = 1
const M_TOT = M_A + M_B
const A_AXIS = 1
const E_ECC = 0.3
const G_CONST = 1
const R_P = A_AXIS * (1 - E_ECC)
const V_P = Math.sqrt((G_CONST * M_TOT * (1 + E_ECC)) / R_P)
const T_ORBIT = 2 * Math.PI * Math.sqrt(A_AXIS ** 3 / (G_CONST * M_TOT))

export const TWO_BODY: Preset = {
  id: 'two-body',
  name: '2체 (비대칭, 이심률 0.3)',
  description:
    '무거운 별과 가벼운 동반성이 공통 무게중심을 도는 타원 궤도. F = G·m₁·m₂ / r² 에서 나오는 케플러의 모양.',
  G: G_CONST,
  // Deliberately coarse (T/120, not the T/600 of the other presets): TWO_BODY
  // is the Euler-vs-RK4 stage (PRD §3, the soul). At this step size RK4 still
  // holds the ellipse near-perfectly (ΔE ≈ 6e-6 over 10 orbits, orbit closes
  // exactly at apoapsis 1.3), while Euler visibly unwinds and leaves the frame
  // within ~3 orbits (~5 s at 1×) — "flip it and the universe breaks." A finer
  // dt would *hide* the lesson by making Euler look fine too. The conservation
  // proofs use their own dt (two-body.test.ts), so this never weakens them.
  recommendedDt: T_ORBIT / 120,
  softening: 0,
  camera: { position: [0, 0, 3], far: 100, minDistance: 0.5, maxDistance: 20 },
  bodies: [
    {
      id: 'star-a', mass: M_A,
      position: new Vector3(-R_P * (M_B / M_TOT), 0, 0),
      velocity: new Vector3(0, -V_P * (M_B / M_TOT), 0),
      color: '#fff1c2', radius: 0.08, label: '별 A',
    },
    {
      id: 'star-b', mass: M_B,
      position: new Vector3(R_P * (M_A / M_TOT), 0, 0),
      velocity: new Vector3(0, V_P * (M_A / M_TOT), 0),
      color: '#7ec8ff', radius: 0.04, label: '별 B',
    },
  ],
}

// ───────────────────────────────────────────────────────────
// TWO_BODY_CIRCULAR — the exact orbit sub-3-2 conservation-proved.
// Equal unit masses, separation 1, v = √2/2, T = π√2.
// Mirrors `circularBinary()` in lib/physics/two-body.test.ts.
// ───────────────────────────────────────────────────────────
const V_CIRC = Math.SQRT2 / 2

export const TWO_BODY_CIRCULAR: Preset = {
  id: 'two-body-circular',
  name: '2체 (검증된 원형 쌍성)',
  description:
    '같은 질량의 쌍성이 닫힌 원을 그림 — 보존 법칙으로 증명한 궤도. 수학적으로 가장 깨끗한 경우.',
  G: 1,
  recommendedDt: (Math.PI * Math.SQRT2) / 600,
  softening: 0,
  camera: { position: [0, 0, 2.5], far: 100, minDistance: 0.5, maxDistance: 20 },
  bodies: [
    {
      id: 'star-a', mass: 1,
      position: new Vector3(-0.5, 0, 0),
      velocity: new Vector3(0, -V_CIRC, 0),
      color: '#f5b942', radius: 0.05, label: '별 A',
    },
    {
      id: 'star-b', mass: 1,
      position: new Vector3(0.5, 0, 0),
      velocity: new Vector3(0, V_CIRC, 0),
      color: '#5fb1ff', radius: 0.05, label: '별 B',
    },
  ],
}

// ───────────────────────────────────────────────────────────
// THREE_BODY — the figure-8 (Moore 1993; Chenciner–Montgomery 2000).
// Three equal masses chasing each other along a single ∞-shaped curve.
// The famous *published exact periodic solution* of the 3-body problem
// — the thing that has no general closed form, yet here is one orbit
// that closes forever.
//
// Initial conditions are magic numbers (not derivable), so they were
// VERIFIED by integration before baking in: one period (T ≈ 6.32591)
// returns to start within 5e-8 and conserves energy to 2.6e-13.
//   v3 = (-0.93240737, -0.86473146);  v1 = v2 = -v3 / 2
// ───────────────────────────────────────────────────────────
const FIG8_V3X = -0.93240737
const FIG8_V3Y = -0.86473146
const T_FIG8 = 6.32591398

export const THREE_BODY: Preset = {
  id: 'three-body',
  name: '3체 (figure-8 궤도)',
  description:
    '같은 질량 세 개가 하나의 ∞ 모양 경로를 따라 서로를 쫓음 — 일반 공식이 없는 문제의 알려진 정확해. 아무것도 건드리지 않으면 영원히 춤춘다.',
  G: 1,
  recommendedDt: T_FIG8 / 600,
  softening: 0,
  camera: { position: [0, 0, 3], far: 100, minDistance: 0.5, maxDistance: 20 },
  bodies: [
    {
      id: 'body-1', mass: 1,
      position: new Vector3(-0.97000436, 0.24308753, 0),
      velocity: new Vector3(-FIG8_V3X / 2, -FIG8_V3Y / 2, 0),
      color: '#fff1c2', radius: 0.04, label: '천체 1',
    },
    {
      id: 'body-2', mass: 1,
      position: new Vector3(0.97000436, -0.24308753, 0),
      velocity: new Vector3(-FIG8_V3X / 2, -FIG8_V3Y / 2, 0),
      color: '#7ec8ff', radius: 0.04, label: '천체 2',
    },
    {
      id: 'body-3', mass: 1,
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(FIG8_V3X, FIG8_V3Y, 0),
      color: '#9ef0a0', radius: 0.04, label: '천체 3',
    },
  ],
}

// ───────────────────────────────────────────────────────────
// BINARY — two comparable-mass stars (3:2), e = 0.4. Distinct from
// TWO_BODY (sun+earth ratio) — here both stars visibly swing about the
// shared barycenter, the cleanest picture of "the heavier one wobbles
// less" (the seed of radial-velocity exoplanet detection, Phase 5).
// Closes within 1.7e-11 over one period (verified).
//   M_A = 3, M_B = 2, a = 1, e = 0.4, G = 1
// ───────────────────────────────────────────────────────────
const BIN_MA = 3
const BIN_MB = 2
const BIN_MT = BIN_MA + BIN_MB
const BIN_A = 1
const BIN_E = 0.4
const BIN_RP = BIN_A * (1 - BIN_E)
const BIN_VP = Math.sqrt((1 * BIN_MT * (1 + BIN_E)) / BIN_RP)
const T_BIN = 2 * Math.PI * Math.sqrt(BIN_A ** 3 / (1 * BIN_MT))

export const BINARY: Preset = {
  id: 'binary',
  name: '쌍성 (질량비 3:2, 이심률 0.4)',
  description:
    '질량이 비슷한 두 별이 공유하는 타원 궤도. 가벼운 별이 더 크게 흔들림 — 실제 별빛에서 보이지 않는 동반성을 드러내는 그 떨림.',
  G: 1,
  recommendedDt: T_BIN / 600,
  softening: 0,
  camera: { position: [0, 0, 3], far: 100, minDistance: 0.5, maxDistance: 20 },
  bodies: [
    {
      id: 'star-a', mass: BIN_MA,
      position: new Vector3(-BIN_RP * (BIN_MB / BIN_MT), 0, 0),
      velocity: new Vector3(0, -BIN_VP * (BIN_MB / BIN_MT), 0),
      color: '#ffd27f', radius: 0.07, label: '별 A',
    },
    {
      id: 'star-b', mass: BIN_MB,
      position: new Vector3(BIN_RP * (BIN_MA / BIN_MT), 0, 0),
      velocity: new Vector3(0, BIN_VP * (BIN_MA / BIN_MT), 0),
      color: '#9fd0ff', radius: 0.06, label: '별 B',
    },
  ],
}

// ───────────────────────────────────────────────────────────
// SOLAR_SYSTEM — Phase 2 revisited, now gravitating for real.
// Built from the real NASA data (data/planets.ts + data/sun.ts),
// normalized to G = 1, distances in AU, masses in M_sun. Circular
// initial velocities v = √(G·M_sun / a); the sun gets the recoil so
// net momentum is zero. dt resolves the *innermost* orbit (Mercury).
// Verified: no blow-up, Earth stays at ~1.00 AU, energy drift 1.3e-11.
//
// NOTE: at the fixed TIME_SPEED of 3-3, inner planets orbit in seconds
// (Mercury ~1.4 s) while the ice giants drift slowly — physically
// correct; 3-6's time controls let you fast-forward the outer system.
// Camera frames the inner system by default; zoom out for Uranus/Neptune.
// ───────────────────────────────────────────────────────────
const ONE_AU_KM = 149_597_870.7
const SUN_MASS_KG = SUN.mass_kg
const SOLAR_G = 1

const PLANET_RENDER: Record<PlanetId, { color: string; radius: number }> = {
  mercury: { color: '#9c9c9c', radius: 0.04 },
  venus: { color: '#e8cda2', radius: 0.045 },
  earth: { color: '#6b93d6', radius: 0.045 },
  mars: { color: '#c1440e', radius: 0.04 },
  jupiter: { color: '#d8ca9d', radius: 0.09 },
  saturn: { color: '#e3d9b0', radius: 0.08 },
  uranus: { color: '#a7e0e0', radius: 0.06 },
  neptune: { color: '#4b70dd', radius: 0.06 },
}

function buildSolarSystem(): Preset {
  const sunBody: PresetBody = {
    id: 'sun', mass: 1,
    position: new Vector3(0, 0, 0),
    velocity: new Vector3(0, 0, 0),
    color: '#fff1c2', radius: 0.15, label: SUN.name.ko,
  }

  const planetBodies: PresetBody[] = PLANETS.map((p, i) => {
    const aAU = p.realDistance_km / ONE_AU_KM
    const mass = p.mass_kg / SUN_MASS_KG
    const theta = (i / PLANETS.length) * Math.PI * 2
    const v = Math.sqrt((SOLAR_G * sunBody.mass) / aAU) // M_total ≈ M_sun
    const render = PLANET_RENDER[p.id]
    return {
      id: p.id, mass,
      position: new Vector3(aAU * Math.cos(theta), aAU * Math.sin(theta), 0),
      velocity: new Vector3(-v * Math.sin(theta), v * Math.cos(theta), 0),
      color: render.color, radius: render.radius, label: p.name.ko,
    }
  })

  // Zero net momentum: the sun absorbs the planets' total recoil.
  const px = planetBodies.reduce((sum, b) => sum + b.mass * b.velocity.x, 0)
  const py = planetBodies.reduce((sum, b) => sum + b.mass * b.velocity.y, 0)
  sunBody.velocity.set(-px / sunBody.mass, -py / sunBody.mass, 0)

  const aMerc = PLANETS[0].realDistance_km / ONE_AU_KM
  const tMerc = 2 * Math.PI * Math.sqrt(aMerc ** 3 / (SOLAR_G * sunBody.mass))

  return {
    id: 'solar-system',
    name: '우리 태양계 (N체)',
    description:
      'Phase 2를 다시 — 이번엔 모든 천체가 서로를 끌어당긴다. 궤도는 미리 그려주지 않는다; F = G·m₁·m₂ / r² 에서 저절로 나타난다.',
    G: SOLAR_G,
    recommendedDt: tMerc / 600,
    softening: 0.001,
    camera: { position: [0, 0, 16], far: 300, minDistance: 0.5, maxDistance: 150 },
    bodies: [sunBody, ...planetBodies],
  }
}

export const SOLAR_SYSTEM: Preset = buildSolarSystem()

// ───────────────────────────────────────────────────────────
// Registry — single source for the selector (sub-3-4). Order = display
// order; solar system is the default first impression (PRD §3).
// ───────────────────────────────────────────────────────────
export const PRESETS: readonly Preset[] = [
  SOLAR_SYSTEM,
  TWO_BODY,
  TWO_BODY_CIRCULAR,
  THREE_BODY,
  BINARY,
]

export const DEFAULT_PRESET_ID: PresetId = 'solar-system'

export function getPreset(id: PresetId): Preset {
  return PRESETS.find((p) => p.id === id) ?? SOLAR_SYSTEM
}
