import { describe, it, expect } from 'vitest'
import {
  easeInOutCubic,
  lerp,
  computeTransitionProgress,
} from './easing'

describe('easeInOutCubic', () => {
  it('starts at 0', () => {
    expect(easeInOutCubic(0)).toBeCloseTo(0)
  })

  it('ends at 1', () => {
    expect(easeInOutCubic(1)).toBeCloseTo(1)
  })

  it('passes through 0.5 at the midpoint (대칭)', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
  })

  it('is monotonically increasing', () => {
    // 단조 증가 — 1.5초 보간 중 *되감기* 가 없어야 함
    const samples = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    const values = samples.map(easeInOutCubic)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1])
    }
  })

  it('is symmetric around 0.5 (S-curve 대칭)', () => {
    // f(t) + f(1-t) = 1 — 가속과 감속이 거울처럼 같다
    const pairs = [0.1, 0.2, 0.3, 0.4]
    for (const t of pairs) {
      expect(easeInOutCubic(t) + easeInOutCubic(1 - t)).toBeCloseTo(1)
    }
  })

  it('starts slow — derivative near 0 at t=0', () => {
    // 첫 5% 변화 < 1% 여야 *툭 끊김* 없는 느낌
    expect(easeInOutCubic(0.05)).toBeLessThan(0.01)
  })

  it('ends slow — derivative near 0 at t=1', () => {
    // 마지막 5% 변화 < 1% 여야 함 (대칭의 자동 결과지만 명시)
    expect(1 - easeInOutCubic(0.95)).toBeLessThan(0.01)
  })
})

describe('lerp', () => {
  it('returns from at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('returns to at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('linearly interpolates', () => {
    expect(lerp(0, 100, 0.25)).toBeCloseTo(25)
    expect(lerp(0, 100, 0.5)).toBeCloseTo(50)
    expect(lerp(0, 100, 0.75)).toBeCloseTo(75)
  })

  it('handles negative ranges', () => {
    // 자전 period 음수 (역회전) 보간을 위해
    expect(lerp(-100, 100, 0.5)).toBeCloseTo(0)
  })

  it('handles inverted ranges (from > to)', () => {
    // 거리 exponent 1.0 → 0.5 처럼 감소 보간
    expect(lerp(1.0, 0.5, 0.5)).toBeCloseTo(0.75)
  })
})

describe('computeTransitionProgress', () => {
  const DURATION = 1500

  it('returns 0 when changedAt equals now', () => {
    // 토글 누른 직후 첫 프레임
    expect(computeTransitionProgress(1000, 1000, DURATION)).toBeCloseTo(0)
  })

  it('returns 0 when now is before changedAt (시계 점프 방어)', () => {
    expect(computeTransitionProgress(900, 1000, DURATION)).toBe(0)
  })

  it('returns 1 when duration has fully elapsed', () => {
    expect(computeTransitionProgress(2500, 1000, DURATION)).toBe(1)
  })

  it('clamps to 1 well past the duration (보간 끝난 후에도 안정)', () => {
    expect(computeTransitionProgress(99999, 1000, DURATION)).toBe(1)
  })

  it('returns 0.5 at half elapsed', () => {
    expect(computeTransitionProgress(1750, 1000, DURATION)).toBeCloseTo(0.5)
  })

  it('returns 1 for non-positive duration (보간 비활성 의미)', () => {
    expect(computeTransitionProgress(1000, 500, 0)).toBe(1)
  })

  it('does not store progress — pure function (패러다임 메모)', () => {
    // 같은 입력 → 같은 출력. side-effect 0. store 거치지 않음의 핵심.
    const a = computeTransitionProgress(1300, 1000, DURATION)
    const b = computeTransitionProgress(1300, 1000, DURATION)
    expect(a).toBe(b)
  })
})
