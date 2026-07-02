import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SCALE,
  computeVisualRadius,
  computeVisualDistance,
  computeMoonVisualDistance,
  computeMoonVisualRadius,
  getInterpolatedScaleConfig,
} from './scale'
import { PLANETS, findPlanetById } from '../data/planets'

const EARTH_RADIUS_KM = 6_371
const MOON_DISTANCE_KM = 384_400
const MOON_RADIUS_KM = 1_737.4

describe('computeMoonVisualDistance', () => {
  it('거리 토글의 영향을 받지 않는다 (부모 반지름 기준)', () => {
    const realCfg = { ...DEFAULT_SCALE, distanceExponent: 1.0, distanceScale: 80 }
    const visual = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const real = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, realCfg)
    expect(real).toBeCloseTo(visual)
  })

  it('radiusScale 에 비례한다', () => {
    const bigger = { ...DEFAULT_SCALE, radiusScale: 2.0 }
    const base = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const scaled = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, bigger)
    expect(scaled).toBeCloseTo(base * 2)
  })

  it('실제 60배 비율을 압축한다 (그대로 아님)', () => {
    const orbit = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const earthRadius = computeVisualRadius(EARTH_RADIUS_KM, DEFAULT_SCALE)
    const literalRatio = MOON_DISTANCE_KM / EARTH_RADIUS_KM // ≈ 60.3
    expect(orbit / earthRadius).toBeLessThan(literalRatio)
    expect(orbit / earthRadius).toBeGreaterThan(1)
  })
})

describe('computeMoonVisualRadius', () => {
  it('행성 sqrt 인플레이션 없이 선형 실제비로 그린다 (더 작다)', () => {
    const moonR = computeMoonVisualRadius(MOON_RADIUS_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const inflated = computeVisualRadius(MOON_RADIUS_KM, DEFAULT_SCALE)
    expect(moonR).toBeLessThan(inflated)
    // 지구 시각반지름 = 1.0 이므로 달 = 실제 비율 ≈ 0.273
    expect(moonR).toBeCloseTo(MOON_RADIUS_KM / EARTH_RADIUS_KM)
  })
})

describe('달 궤도 충돌 안전성 (시각 모드)', () => {
  const orbit = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
  const moonRadius = computeMoonVisualRadius(MOON_RADIUS_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
  const earthRadius = computeVisualRadius(EARTH_RADIUS_KM, DEFAULT_SCALE)

  it('지구 표면 밖에서 돈다 (안 박힘)', () => {
    expect(orbit - moonRadius).toBeGreaterThan(earthRadius)
  })

  it('어떤 행성과도 최접근 시 겹치지 않는다 (regression: 금성/화성 충돌)', () => {
    const earth = findPlanetById('earth')!
    const earthDist = computeVisualDistance(earth.realDistance_km, DEFAULT_SCALE)
    const moonReach = orbit + moonRadius // 지구 중심에서 달이 닿는 최대 거리

    for (const p of PLANETS) {
      if (p.id === 'earth') continue
      const pDist = computeVisualDistance(p.realDistance_km, DEFAULT_SCALE)
      const pRadius = computeVisualRadius(p.realRadius_km, DEFAULT_SCALE)
      const closestCenter = Math.abs(earthDist - pDist) // 방사 정렬 시 중심간 거리
      expect(moonReach).toBeLessThan(closestCenter - pRadius)
    }
  })
})

// sub-2-4 거리 토글: getInterpolatedScaleConfig 는 exponent + scale 을 동시에
// 보간한다. visual(exp 0.5 / scale 20) ↔ real(exp 1.0 / scale 80).
describe('getInterpolatedScaleConfig — distanceExponent 보간', () => {
  it('mode=real, progress=0 → 0.5 (출발 = visual)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0)
    expect(cfg.distanceExponent).toBeCloseTo(0.5)
  })

  it('mode=real, progress=1 → 1.0 (도착 = real)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 1)
    expect(cfg.distanceExponent).toBeCloseTo(1.0)
  })

  it('mode=visual, progress=0 → 1.0 / progress=1 → 0.5', () => {
    expect(
      getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 0).distanceExponent,
    ).toBeCloseTo(1.0)
    expect(
      getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 1).distanceExponent,
    ).toBeCloseTo(0.5)
  })

  it('progress=0.5 → 0.75 (lerp 중간값)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.5)
    expect(cfg.distanceExponent).toBeCloseTo(0.75)
  })
})

describe('getInterpolatedScaleConfig — distanceScale 보간', () => {
  it('mode=real, progress=0 → 20 (출발 = visual scale)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0)
    expect(cfg.distanceScale).toBeCloseTo(20)
  })

  it('mode=real, progress=1 → 80 (도착 = real scale, 4배 확장)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 1)
    expect(cfg.distanceScale).toBeCloseTo(80)
  })

  it('mode=visual, progress=0 → 80 / progress=1 → 20', () => {
    expect(
      getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 0).distanceScale,
    ).toBeCloseTo(80)
    expect(
      getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 1).distanceScale,
    ).toBeCloseTo(20)
  })

  it('progress=0.5 → 50 (lerp 중간값)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.5)
    expect(cfg.distanceScale).toBeCloseTo(50)
  })
})

describe('getInterpolatedScaleConfig — radius 필드 불변', () => {
  it('radiusExponent / radiusScale 은 baseConfig 그대로', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.5)
    expect(cfg.radiusExponent).toBe(DEFAULT_SCALE.radiusExponent)
    expect(cfg.radiusScale).toBe(DEFAULT_SCALE.radiusScale)
  })

  it('baseConfig 자체를 mutate 하지 않는다 (참조 불변성)', () => {
    const snapshot = { ...DEFAULT_SCALE }
    getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.7)
    expect(DEFAULT_SCALE).toEqual(snapshot)
  })
})

describe('수성 안 박힘 보장 (sub-2-4 핵심 검증)', () => {
  // sub-2-4 의 *왜* — 수성 거리가 태양 반지름보다 작아져 박히는 문제.
  const MERCURY_KM = 0.387 * 149_600_000 // ≈ 57.9 M km
  const SUN_RADIUS_VISUAL = Math.sqrt(695_700 / 6_371) * 1.0 // ≈ 10.45

  it('real 모드 도달 시 수성이 태양 반지름 *밖* 에 있다', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 1)
    const mercuryDist = computeVisualDistance(MERCURY_KM, cfg)
    // real: 0.387 × 80 = 30.96. 태양 반지름 10.45 의 약 3배
    expect(mercuryDist).toBeGreaterThan(SUN_RADIUS_VISUAL)
    expect(mercuryDist).toBeCloseTo(30.96, 1)
  })

  it('visual 모드에서도 태양 밖 (기존 보장)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 1)
    const mercuryDist = computeVisualDistance(MERCURY_KM, cfg)
    // visual: sqrt(0.387) × 20 = 12.44
    expect(mercuryDist).toBeGreaterThan(SUN_RADIUS_VISUAL)
    expect(mercuryDist).toBeCloseTo(12.44, 1)
  })
})

describe('해왕성 — 진실의 광활함 (PRD §3 영혼)', () => {
  it('real 모드 도달 시 해왕성이 visual 의 *20배 이상* 멀어진다', () => {
    const NEPTUNE_KM = 30.05 * 149_600_000
    const cfgVisual = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0)
    const cfgReal = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 1)

    const dVisual = computeVisualDistance(NEPTUNE_KM, cfgVisual)
    const dReal = computeVisualDistance(NEPTUNE_KM, cfgReal)

    // visual: sqrt(30.05) × 20 ≈ 110
    // real:   30.05 × 80     = 2404 (22배 멀어짐 — *길을 잃는다*)
    expect(dVisual).toBeCloseTo(109.6, 0)
    expect(dReal).toBeCloseTo(2404, 0)
    expect(dReal / dVisual).toBeGreaterThan(20)
  })
})
