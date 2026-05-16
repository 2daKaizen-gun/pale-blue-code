/**
 * ⚠️ 적용 가이드 — sub-2-4 [Fix] 갱신:
 *   기존 lib/scale.test.ts 끝에 *이전에 append 했던* describe('getInterpolatedScaleConfig', ...)
 *   블록을 **통째로 삭제** 후 아래 새 블록으로 교체.
 *
 *   import 는 그대로 유지:
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

describe('getInterpolatedScaleConfig — distanceScale 보간 (sub-2-4 [Fix])', () => {
  // sub-2-4 [Fix] 추가: 수성이 태양 안으로 박히는 문제 해결 위해 scale 도 보간.

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

describe('수성 안 박힘 보장 (sub-2-4 [Fix] 핵심 검증)', () => {
  // sub-2-4 [Fix] 의 *왜* — 수성 거리가 태양 반지름보다 작아져 박히는 문제.

  const MERCURY_KM = 0.387 * 149_600_000  // ≈ 57.9 M km
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
