import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SCALE,
  computeVisualRadius,
  computeVisualDistance,
  computeMoonVisualDistance,
  computeMoonVisualRadius,
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
