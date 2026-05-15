/**
 * ⚠️ append 가이드 (Light 6a):
 *   lib/time.test.ts 의 import 문에 `getInterpolatedRotationPeriod` 추가.
 *   파일 *맨 아래* 에 아래 describe 블록 append.
 */

import { describe, it, expect } from 'vitest'
import {
  getInterpolatedRotationPeriod,
  getVisualRotationPeriod,
  getEffectiveRotationPeriod,
} from './time'

describe('getInterpolatedRotationPeriod', () => {
  it('mode=real, progress=0 → visual 값 (출발 = 압축된 visual)', () => {
    // 지구 23.93h 의 visual ≈ 23.96h
    const result = getInterpolatedRotationPeriod(23.93, 'real', 0)
    expect(result).toBeCloseTo(getVisualRotationPeriod(23.93))
  })

  it('mode=real, progress=1 → real 값 (도착 = NASA 원본)', () => {
    const result = getInterpolatedRotationPeriod(23.93, 'real', 1)
    expect(result).toBeCloseTo(23.93)
  })

  it('mode=visual, progress=0 → real 값 (출발 = 원본)', () => {
    const result = getInterpolatedRotationPeriod(23.93, 'visual', 0)
    expect(result).toBeCloseTo(23.93)
  })

  it('mode=visual, progress=1 → visual 값 (도착 = 압축)', () => {
    const result = getInterpolatedRotationPeriod(23.93, 'visual', 1)
    expect(result).toBeCloseTo(getVisualRotationPeriod(23.93))
  })

  it('수성 보간 — 진실로 갈수록 *느려진다* (정량 검증)', () => {
    // 수성 real 1407.6h, visual 184h. real 모드 가는 중엔 period 증가 = 느려짐
    const start = getInterpolatedRotationPeriod(1407.6, 'real', 0)
    const mid = getInterpolatedRotationPeriod(1407.6, 'real', 0.5)
    const end = getInterpolatedRotationPeriod(1407.6, 'real', 1)
    expect(start).toBeCloseTo(184, 0)   // visual
    expect(end).toBeCloseTo(1407.6, 0)  // real
    expect(mid).toBeCloseTo((184 + 1407.6) / 2, 0) // lerp 중간
    expect(start).toBeLessThan(end) // *수성이 진실 모드 도달 시 거의 멈춤* 의 수학
  })

  it('목성 보간 — 진실로 갈수록 *빨라진다* (정량 검증)', () => {
    // 목성 real 9.93h, visual 15.4h. real 모드 가는 중엔 period 감소 = 빨라짐
    const start = getInterpolatedRotationPeriod(9.93, 'real', 0)
    const end = getInterpolatedRotationPeriod(9.93, 'real', 1)
    expect(start).toBeCloseTo(15.4, 1) // visual (느림)
    expect(end).toBeCloseTo(9.93, 1)   // real (빠름)
    expect(end).toBeLessThan(start) // *목성이 진실 모드 도달 시 광속* 의 수학
  })

  it('금성 음수 보간 — 부호 보존 (역회전 유지)', () => {
    // 금성 real -5832.5h, visual -374h. 둘 다 음수 → 보간 중 항상 음수
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

describe('보간 + axial-flip 합성 (Light 6 호출 측 시뮬레이션)', () => {
  // Planet/Ring/Sun 의 매 프레임 흐름 미리 검증:
  //   real → interpolated (보간) → effective (보정) → angle

  it('금성 토글 중 합성 — axial-flip 보정이 보간 값에도 작동', () => {
    // 금성: real -5832.5h, axialTilt 177.4° (flipped)
    const real = -5832.5
    const tilt = 177.4

    const interpolated = getInterpolatedRotationPeriod(real, 'real', 0.5)
    expect(interpolated).toBeLessThan(0) // 보간 중 음수 유지

    const effective = getEffectiveRotationPeriod(interpolated, tilt)
    expect(effective).toBeGreaterThan(0) // flip 보정 → 양수
  })

  it('지구 보간 중 합성 — 정상 case 부호 그대로', () => {
    const real = 23.93
    const tilt = 23.5

    const interpolated = getInterpolatedRotationPeriod(real, 'real', 0.5)
    const effective = getEffectiveRotationPeriod(interpolated, tilt)
    expect(effective).toBeGreaterThan(0) // 둘 다 양수
  })
})
