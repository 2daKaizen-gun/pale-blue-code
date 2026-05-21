import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SCALE,
  computeVisualRadius,
  computeMoonVisualDistance,
} from './scale'

const EARTH_RADIUS_KM = 6_371
const MOON_DISTANCE_KM = 384_400

describe('computeMoonVisualDistance', () => {
  it('지구 표면 밖에 둔다 (박히지 않음)', () => {
    const earthRadius = computeVisualRadius(EARTH_RADIUS_KM, DEFAULT_SCALE)
    const moonDist = computeMoonVisualDistance(
      MOON_DISTANCE_KM,
      EARTH_RADIUS_KM,
      DEFAULT_SCALE,
    )
    expect(moonDist).toBeGreaterThan(earthRadius)
  })

  it('거리 토글의 영향을 받지 않는다 (부모 반지름 기준)', () => {
    const realCfg = { ...DEFAULT_SCALE, distanceExponent: 1.0, distanceScale: 80 }
    const visual = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const real = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, realCfg)
    expect(real).toBeCloseTo(visual)
  })

  it('radiusScale 에 비례한다 (천체가 커지면 달 offset 도)', () => {
    const bigger = { ...DEFAULT_SCALE, radiusScale: 2.0 }
    const base = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const scaled = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, bigger)
    expect(scaled).toBeCloseTo(base * 2)
  })

  it('실제 60배 비율을 압축한다 (그대로 아님)', () => {
    const moonDist = computeMoonVisualDistance(MOON_DISTANCE_KM, EARTH_RADIUS_KM, DEFAULT_SCALE)
    const earthRadius = computeVisualRadius(EARTH_RADIUS_KM, DEFAULT_SCALE)
    const literalRatio = MOON_DISTANCE_KM / EARTH_RADIUS_KM // ≈ 60.3
    expect(moonDist / earthRadius).toBeLessThan(literalRatio)
    expect(moonDist / earthRadius).toBeGreaterThan(1)
  })
})
