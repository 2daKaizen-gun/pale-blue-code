/**
 * ⚠️ 적용 가이드 — sub-2-4 [Fix] 갱신:
 *   기존 lib/time.test.ts 끝에 *이전에 append 했던* 다음 4개 describe 블록을 **통째로 삭제**:
 *     - describe('getVisualRotationPeriod', ...)
 *     - describe('getVisualRotationPeriod ∘ getEffectiveRotationPeriod 합성', ...)
 *     - describe('getInterpolatedRotationPeriod', ...)
 *     - describe('보간 + axial-flip 합성 ...', ...)
 *
 *   삭제 후 아래 새 블록 전체로 교체. import 는 그대로 유지:
 *     import {
 *       getVisualRotationPeriod,
 *       getEffectiveRotationPeriod,
 *       getInterpolatedRotationPeriod,
 *     } from './time'
 */

import { describe, it, expect } from 'vitest'
import {
  getVisualRotationPeriod,
  getEffectiveRotationPeriod,
  getInterpolatedRotationPeriod,
} from './time'

describe('getVisualRotationPeriod — exp=0.3 압축 (sub-2-4 [Fix])', () => {
  // sub-2-4 [Fix] 갱신: exp 0.5 → 0.3. *수성/금성 더 강하게 압축* 해
  //   visual ↔ real 차이가 *체감 가능* 수준으로 확대.

  it('returns 0 for 0 input (가드)', () => {
    expect(getVisualRotationPeriod(0)).toBe(0)
  })

  it('preserves sign for positive period (지구 — 정회전)', () => {
    const result = getVisualRotationPeriod(23.93)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeCloseTo(23.98, 1)
  })

  it('preserves sign for negative period (금성 — 역회전)', () => {
    const result = getVisualRotationPeriod(-5832.5)
    expect(result).toBeLessThan(0)
    expect(result).toBeCloseTo(-124.7, 0)
  })

  it('compresses long periods strongly (수성 1407.6h → 81h)', () => {
    // 약 17배 압축 (sqrt 시절 7.6배 보다 강함 — *수성이 도는 게 보임* 의 핵심)
    const result = getVisualRotationPeriod(1407.6)
    expect(result).toBeCloseTo(81.4, 0)
    expect(result).toBeLessThan(1407.6 / 5) // 5배 이상 압축
  })

  it('expands short periods toward 24h (목성 9.93h → 18.4h)', () => {
    const result = getVisualRotationPeriod(9.93)
    expect(result).toBeCloseTo(18.4, 0)
    expect(result).toBeGreaterThan(9.93) // 팽창됨
  })

  it('leaves 24h unchanged (기준점)', () => {
    expect(getVisualRotationPeriod(24)).toBeCloseTo(24)
  })

  it('leaves -24h unchanged with sign preserved', () => {
    expect(getVisualRotationPeriod(-24)).toBeCloseTo(-24)
  })

  it('produces new TechSpec table values (exp=0.3 전 행성)', () => {
    expect(getVisualRotationPeriod(1407.6)).toBeCloseTo(81.4, 0)   // 수성
    expect(getVisualRotationPeriod(-5832.5)).toBeCloseTo(-124.7, 0) // 금성
    expect(getVisualRotationPeriod(23.93)).toBeCloseTo(24, 0)      // 지구
    expect(getVisualRotationPeriod(24.62)).toBeCloseTo(24.2, 1)    // 화성
    expect(getVisualRotationPeriod(9.93)).toBeCloseTo(18.4, 1)     // 목성
    expect(getVisualRotationPeriod(10.66)).toBeCloseTo(18.8, 1)    // 토성
    expect(getVisualRotationPeriod(-17.24)).toBeCloseTo(-21.7, 1)  // 천왕성
    expect(getVisualRotationPeriod(16.11)).toBeCloseTo(21.3, 1)    // 해왕성
    expect(getVisualRotationPeriod(609.12)).toBeCloseTo(63.3, 1)   // 태양
  })

  it('is monotonic on positive inputs (큰 real → 큰 visual)', () => {
    expect(getVisualRotationPeriod(9.93)).toBeLessThan(
      getVisualRotationPeriod(24),
    )
    expect(getVisualRotationPeriod(24)).toBeLessThan(
      getVisualRotationPeriod(1407.6),
    )
  })
})

describe('getInterpolatedRotationPeriod — 새 수치 검증', () => {
  it('mode=real, progress=0 → visual 값', () => {
    expect(getInterpolatedRotationPeriod(23.93, 'real', 0)).toBeCloseTo(23.98, 1)
  })

  it('mode=real, progress=1 → real 값', () => {
    expect(getInterpolatedRotationPeriod(23.93, 'real', 1)).toBeCloseTo(23.93)
  })

  it('mode=visual, progress=0 → real / progress=1 → visual', () => {
    expect(getInterpolatedRotationPeriod(23.93, 'visual', 0)).toBeCloseTo(23.93)
    expect(getInterpolatedRotationPeriod(23.93, 'visual', 1)).toBeCloseTo(23.98, 1)
  })

  it('수성 진실 도달 시 *멈춤* — 17배 느려진다', () => {
    // visual 81h → real 1407.6h. 1초당 회전: 30% → 1.7%
    const start = getInterpolatedRotationPeriod(1407.6, 'real', 0)
    const end = getInterpolatedRotationPeriod(1407.6, 'real', 1)
    expect(start).toBeCloseTo(81.4, 0)
    expect(end).toBeCloseTo(1407.6, 0)
    expect(end / start).toBeGreaterThan(15) // *PRD §3 의 수성이 멈추는 순간*
  })

  it('목성 진실 도달 시 *광속* — 1.85배 빨라진다', () => {
    // visual 18.4h → real 9.93h. 1초당 회전: 130% → 244%
    const start = getInterpolatedRotationPeriod(9.93, 'real', 0)
    const end = getInterpolatedRotationPeriod(9.93, 'real', 1)
    expect(start).toBeCloseTo(18.4, 1)
    expect(end).toBeCloseTo(9.93, 1)
    expect(start / end).toBeGreaterThan(1.8) // *PRD §3 의 목성이 가속되는 순간*
  })

  it('금성 보간 — 부호 보존 (역회전 일관 유지)', () => {
    const start = getInterpolatedRotationPeriod(-5832.5, 'real', 0)
    const mid = getInterpolatedRotationPeriod(-5832.5, 'real', 0.5)
    const end = getInterpolatedRotationPeriod(-5832.5, 'real', 1)
    expect(start).toBeLessThan(0)
    expect(mid).toBeLessThan(0)
    expect(end).toBeLessThan(0)
    expect(end).toBeCloseTo(-5832.5, 0)
  })

  it('0 입력 → 0 (정지 행성 가드)', () => {
    expect(getInterpolatedRotationPeriod(0, 'real', 0.5)).toBe(0)
    expect(getInterpolatedRotationPeriod(0, 'visual', 0.5)).toBe(0)
  })
})

describe('보간 + axial-flip 합성 — 호출 측 시뮬레이션', () => {
  it('금성 토글 중 합성 — axial-flip 보정 작동', () => {
    const real = -5832.5
    const tilt = 177.4
    const interpolated = getInterpolatedRotationPeriod(real, 'real', 0.5)
    expect(interpolated).toBeLessThan(0)
    const effective = getEffectiveRotationPeriod(interpolated, tilt)
    expect(effective).toBeGreaterThan(0)
  })

  it('지구 보간 중 합성 — 정상 case 부호 그대로', () => {
    const interpolated = getInterpolatedRotationPeriod(23.93, 'real', 0.5)
    const effective = getEffectiveRotationPeriod(interpolated, 23.5)
    expect(effective).toBeGreaterThan(0)
  })
})
