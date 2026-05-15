/**
 * ⚠️ append 가이드:
 *   기존 lib/scale.test.ts 파일 *맨 아래* 에 아래 describe 블록 추가.
 *   import 문에 `getInterpolatedScaleConfig`, `ScaleMode`, `DEFAULT_SCALE` 추가.
 *
 *   예) 기존:
 *     import { computeVisualRadius, computeVisualDistance } from './scale'
 *   변경:
 *     import {
 *       computeVisualRadius,
 *       computeVisualDistance,
 *       getInterpolatedScaleConfig,
 *       DEFAULT_SCALE,
 *       type ScaleMode,
 *     } from './scale'
 */

import { describe, it, expect } from 'vitest'
import {
  getInterpolatedScaleConfig,
  computeVisualDistance,
  DEFAULT_SCALE,
} from './scale'

describe('getInterpolatedScaleConfig', () => {
  it('mode=real, progress=0 → distanceExponent=0.5 (출발 = visual)', () => {
    // 토글 직후 = 직전 모드의 값. real 로 가는 출발점은 visual(0.5).
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0)
    expect(cfg.distanceExponent).toBeCloseTo(0.5)
  })

  it('mode=real, progress=1 → distanceExponent=1.0 (도착 = real)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 1)
    expect(cfg.distanceExponent).toBeCloseTo(1.0)
  })

  it('mode=visual, progress=0 → distanceExponent=1.0 (출발 = real)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 0)
    expect(cfg.distanceExponent).toBeCloseTo(1.0)
  })

  it('mode=visual, progress=1 → distanceExponent=0.5 (도착 = visual)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'visual', 1)
    expect(cfg.distanceExponent).toBeCloseTo(0.5)
  })

  it('progress=0.5 → 중간값 0.75 (lerp 검증)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.5)
    expect(cfg.distanceExponent).toBeCloseTo(0.75)
  })

  it('나머지 필드는 baseConfig 그대로 (불변)', () => {
    const cfg = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.5)
    expect(cfg.radiusExponent).toBe(DEFAULT_SCALE.radiusExponent)
    expect(cfg.radiusScale).toBe(DEFAULT_SCALE.radiusScale)
    expect(cfg.distanceScale).toBe(DEFAULT_SCALE.distanceScale)
  })

  it('baseConfig 자체를 mutate 하지 않는다 (참조 불변성)', () => {
    const snapshot = { ...DEFAULT_SCALE }
    getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.7)
    expect(DEFAULT_SCALE).toEqual(snapshot)
  })

  it('지구 거리 보간 — visual 진실 토글 시 *멀어지는 방향* 으로 변환', () => {
    // 1 AU 지구. progress 0→1 (mode=real) 동안 거리가 *증가*. 케플러 비례 풀림.
    const EARTH_KM = 149_600_000
    const cfgStart = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0)
    const cfgMid = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 0.5)
    const cfgEnd = getInterpolatedScaleConfig(DEFAULT_SCALE, 'real', 1)

    const dStart = computeVisualDistance(EARTH_KM, cfgStart) // exp=0.5 → 20
    const dMid = computeVisualDistance(EARTH_KM, cfgMid)     // exp=0.75 → 20
    const dEnd = computeVisualDistance(EARTH_KM, cfgEnd)     // exp=1.0 → 20

    // 지구는 1 AU 라 어떤 exponent 든 결과 같음 (1^x = 1). 별도 검증
    expect(dStart).toBeCloseTo(20)
    expect(dEnd).toBeCloseTo(20)

    // 해왕성 (30 AU) 으로 단조 증가 확인 — *진실로 갈수록 멀어짐*
    const NEPTUNE_KM = 30.05 * EARTH_KM
    const nStart = computeVisualDistance(NEPTUNE_KM, cfgStart) // ≈ 110
    const nEnd = computeVisualDistance(NEPTUNE_KM, cfgEnd)     // ≈ 601
    expect(nEnd).toBeGreaterThan(nStart) // 진실 = 더 멀리
    expect(nStart).toBeCloseTo(109.6, 0)
    expect(nEnd).toBeCloseTo(601, 0)
  })
})
