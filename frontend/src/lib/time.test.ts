import { describe, it, expect } from 'vitest'
import {
  computeOrbitAngle,
  computeRotationAngle,
  getEffectiveRotationPeriod,
} from './time'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 프로젝트 첫 테스트 파일. Phase 6 BLS 알고리즘 시기에 진가를 발휘할
 * *순수 함수 TDD* 의 첫 적용 사례.
 *
 * 검증 전략:
 *   - 정확한 값 (0, 정주기, 반주기) 은 toBe / toBeCloseTo
 *   - 실제 천체 데이터 (수성 88일, 해왕성 60182일, 금성 -5832.5h) 로
 *     상대 비율 검증 → *실제 우주의 비례* 가 코드에 반영되는지
 *
 * ─── -0 vs +0 ───────────────────────────────────────
 *   IEEE 754 는 0 에도 부호 비트를 보관. 음수로 나눈 0 은 -0.
 *   Object.is(0, -0) === false → toBe 는 깐깐함.
 *   시각적으로는 무관하니 음수 주기 케이스는 toBeCloseTo 로 *부동소수점 근사 비교*.
 *   원리적 TDD 학습 포인트: *수학적 같음* ≠ *비트 표현 같음*.
 */

describe('computeOrbitAngle', () => {
  it('returns initialAngle when simulationDays is 0', () => {
    expect(computeOrbitAngle(0, 365.25, 0)).toBe(0)
    expect(computeOrbitAngle(0, 365.25, Math.PI / 2)).toBe(Math.PI / 2)
  })

  it('completes 2π after one full orbital period', () => {
    const earthPeriod = 365.25
    const result = computeOrbitAngle(earthPeriod, earthPeriod, 0)
    expect(result).toBeCloseTo(2 * Math.PI, 10)
  })

  it('reaches π at half period', () => {
    const result = computeOrbitAngle(182.625, 365.25, 0)
    expect(result).toBeCloseTo(Math.PI, 10)
  })

  it('accumulates beyond 2π (no modulo — caller handles via cos/sin)', () => {
    const result = computeOrbitAngle(730.5, 365.25, 0)
    expect(result).toBeCloseTo(4 * Math.PI, 10)
  })

  it('preserves initialAngle offset across full periods', () => {
    const result = computeOrbitAngle(365.25, 365.25, Math.PI / 4)
    expect(result).toBeCloseTo(Math.PI / 4 + 2 * Math.PI, 10)
  })

  it('mercury advances 684x faster than neptune in same elapsed time', () => {
    // 실제 우주의 비례: 60182 / 88 ≈ 684
    const elapsed = 100
    const mercury = computeOrbitAngle(elapsed, 88, 0)
    const neptune = computeOrbitAngle(elapsed, 60182, 0)
    expect(mercury / neptune).toBeCloseTo(60182 / 88, 5)
  })
})

describe('computeRotationAngle', () => {
  it('returns 0 when simulationDays is 0', () => {
    expect(computeRotationAngle(0, 24)).toBe(0)
    // 음수 주기로 나눈 0 = -0 (IEEE 754). 시각적 무관 → toBeCloseTo 로 근사 비교.
    expect(computeRotationAngle(0, -5832.5)).toBeCloseTo(0, 10)
  })

  it('completes 2π after one earth day for 24h rotation', () => {
    const result = computeRotationAngle(1, 24)
    expect(result).toBeCloseTo(2 * Math.PI, 10)
  })

  it('reaches π at half day for 24h rotation', () => {
    const result = computeRotationAngle(0.5, 24)
    expect(result).toBeCloseTo(Math.PI, 10)
  })

  it('produces negative angle for retrograde rotation (Venus)', () => {
    // 금성 자전 주기 = -5832.5h = -243.02 days. 그만큼의 시뮬레이션 시간 후
    // 정확히 -2π (시계 방향 1회전).
    const venusPeriodHours = -5832.5
    const venusPeriodDays = Math.abs(venusPeriodHours / 24)
    const result = computeRotationAngle(venusPeriodDays, venusPeriodHours)
    expect(result).toBeCloseTo(-2 * Math.PI, 10)
  })

  it('jupiter rotates faster than earth (실제: 9.93h vs 24h)', () => {
    const elapsed = 1
    const jupiter = computeRotationAngle(elapsed, 9.93)
    const earth = computeRotationAngle(elapsed, 24)
    expect(Math.abs(jupiter)).toBeGreaterThan(Math.abs(earth))
  })

  it('uranus retrograde (실제: -17.24h, axial tilt 97.77°와 결합 시 옆으로 누운 회전)', () => {
    const result = computeRotationAngle(1, -17.24)
    // 약 1.39 회전 시계 방향 → -2π * (24/17.24)
    expect(result).toBeCloseTo(-2 * Math.PI * (24 / 17.24), 10)
    expect(result).toBeLessThan(0)
  })
})

describe('getEffectiveRotationPeriod', () => {
  it('preserves period when axial tilt is upright (0-90°)', () => {
    // 지구: 23.5° 기울기, 정방향 자전
    expect(getEffectiveRotationPeriod(23.93, 23.5)).toBe(23.93)
    // 화성: 25.19° 기울기
    expect(getEffectiveRotationPeriod(24.62, 25.19)).toBe(24.62)
    // 수성: 거의 0° 기울기
    expect(getEffectiveRotationPeriod(1407.6, 0.034)).toBe(1407.6)
  })

  it('flips period sign when axial tilt is between 90° and 270° (flipped frame)', () => {
    // 금성: NASA 관습 그대로 (axial 177.4° + period -5832.5h) 는
    // Three.js 회전 행렬 적용 시 부호 캔슬 → 보정 위해 부호 반전
    expect(getEffectiveRotationPeriod(-5832.5, 177.4)).toBe(5832.5)

    // 천왕성: 97.77° 도 뒤집힘 범위에 포함 → 부호 반전
    expect(getEffectiveRotationPeriod(-17.24, 97.77)).toBe(17.24)
  })

  it('handles edge cases at exactly 90° and 270° (not flipped)', () => {
    // 정확히 90° 는 *회전축이 공전면에 누움* — 완전 뒤집힘 X
    expect(getEffectiveRotationPeriod(24, 90)).toBe(24)
    expect(getEffectiveRotationPeriod(24, 270)).toBe(24)
  })
})
