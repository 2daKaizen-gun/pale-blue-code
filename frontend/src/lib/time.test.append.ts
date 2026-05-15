/**
 * ⚠️ append 가이드:
 *   기존 lib/time.test.ts 파일 *맨 아래* 에 아래 describe 블록을 추가.
 *   import 문은 기존 파일에서 `getVisualRotationPeriod` 만 추가 분리.
 *
 *   예) 기존:
 *     import { computeOrbitAngle, computeRotationAngle, getEffectiveRotationPeriod } from './time'
 *   변경:
 *     import {
 *       computeOrbitAngle,
 *       computeRotationAngle,
 *       getEffectiveRotationPeriod,
 *       getVisualRotationPeriod,
 *     } from './time'
 */

import { describe, it, expect } from 'vitest'
import {
  getVisualRotationPeriod,
  getEffectiveRotationPeriod,
} from './time'

describe('getVisualRotationPeriod', () => {
  it('returns 0 for 0 input (가드)', () => {
    expect(getVisualRotationPeriod(0)).toBe(0)
  })

  it('preserves sign for positive period (지구 — 정회전)', () => {
    // 지구 23.93h → 약 23.96h. 24h 기준점 근처는 거의 불변
    const result = getVisualRotationPeriod(23.93)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeCloseTo(23.96, 1)
  })

  it('preserves sign for negative period (금성 — 역회전)', () => {
    // 금성 -5832.5h → -374h. 역회전이 visual 에서도 보존
    const result = getVisualRotationPeriod(-5832.5)
    expect(result).toBeLessThan(0)
    expect(result).toBeCloseTo(-374, 0)
  })

  it('compresses long periods toward 24h (수성)', () => {
    // 수성 1407.6h (58.65일) → 184h (7.7일). 압축 비율 약 7.6배
    const result = getVisualRotationPeriod(1407.6)
    expect(result).toBeCloseTo(184, 0)
    expect(result).toBeLessThan(1407.6) // 압축됨
  })

  it('expands short periods toward 24h (목성)', () => {
    // 목성 9.93h → 15.4h. 빠른 자전을 *느리게* 늘려서 보이게 함
    const result = getVisualRotationPeriod(9.93)
    expect(result).toBeCloseTo(15.4, 1)
    expect(result).toBeGreaterThan(9.93) // 팽창됨
  })

  it('leaves 24h unchanged (기준점)', () => {
    // 정확히 24h 면 그대로 24h — sqrt(1) × 24 = 24
    expect(getVisualRotationPeriod(24)).toBeCloseTo(24)
  })

  it('leaves -24h unchanged with sign preserved (가상 역회전 기준점)', () => {
    expect(getVisualRotationPeriod(-24)).toBeCloseTo(-24)
  })

  it('produces TechSpec table values (NASA 전 행성)', () => {
    // TechSpec §3 시간/자전 변환 표의 visual 컬럼 검증
    expect(getVisualRotationPeriod(1407.6)).toBeCloseTo(184, 0)   // 수성
    expect(getVisualRotationPeriod(-5832.5)).toBeCloseTo(-374, 0) // 금성
    expect(getVisualRotationPeriod(23.93)).toBeCloseTo(24, 0)     // 지구
    expect(getVisualRotationPeriod(24.62)).toBeCloseTo(24.3, 1)   // 화성
    expect(getVisualRotationPeriod(9.93)).toBeCloseTo(15.4, 1)    // 목성
    expect(getVisualRotationPeriod(10.66)).toBeCloseTo(16.0, 1)   // 토성
    expect(getVisualRotationPeriod(-17.24)).toBeCloseTo(-20.3, 1) // 천왕성
    expect(getVisualRotationPeriod(16.11)).toBeCloseTo(19.7, 1)   // 해왕성
  })

  it('is monotonic on positive inputs (큰 real → 큰 visual)', () => {
    // 단조성 — 압축 후에도 순서 보존. 수성(느림) → 목성(빠름) 순서 유지
    expect(getVisualRotationPeriod(9.93)).toBeLessThan(
      getVisualRotationPeriod(24),
    )
    expect(getVisualRotationPeriod(24)).toBeLessThan(
      getVisualRotationPeriod(1407.6),
    )
  })
})

describe('getVisualRotationPeriod ∘ getEffectiveRotationPeriod 합성', () => {
  // sub-2-4 핵심: visual → effective 순서로 합성해도 *real → effective* 와
  // 같은 axial-flip 보정이 작동해야 함.

  it('금성 visual 모드에서 axial-flip 부호 반전이 작동한다', () => {
    // 금성 — real -5832.5h, axialTilt 177.4° (flipped)
    const real = -5832.5
    const tilt = 177.4

    // visual 압축 → 부호 보존 → -374h
    const visual = getVisualRotationPeriod(real)
    expect(visual).toBeLessThan(0)

    // effective 보정 → flipped 라 부호 반전 → +374h
    const effective = getEffectiveRotationPeriod(visual, tilt)
    expect(effective).toBeGreaterThan(0)
    expect(effective).toBeCloseTo(374, 0)
  })

  it('천왕성 visual 모드에서 axial-flip 부호 반전이 작동한다', () => {
    // 천왕성 — real -17.24h, axialTilt 97.77° (flipped)
    const real = -17.24
    const tilt = 97.77

    const visual = getVisualRotationPeriod(real)
    const effective = getEffectiveRotationPeriod(visual, tilt)

    // 두 번 부호 반전 (real 음수 + flipped) → 양수
    expect(effective).toBeGreaterThan(0)
  })

  it('지구는 합성해도 변하지 않는다 (정상 case)', () => {
    // 지구 — real 23.93h, axialTilt 23.5° (not flipped)
    const real = 23.93
    const tilt = 23.5

    const visual = getVisualRotationPeriod(real)
    const effective = getEffectiveRotationPeriod(visual, tilt)

    // 압축 + flip 미적용 → 거의 그대로
    expect(effective).toBeCloseTo(23.96, 1)
  })
})
