import { describe, it, expect } from 'vitest'
import {
  computeOrbitAngle,
  computeRotationAngle,
  getEffectiveRotationPeriod,
  getVisualRotationPeriod,
  getInterpolatedRotationPeriod,
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

// sub-2-4 자전 토글: exp=0.3 부호 보존 압축. 24h(지구) 기준점은 거의 불변,
// 극단 주기(수성/금성)는 강하게 압축해 visual↔real 차이를 체감 가능하게.
describe('getVisualRotationPeriod — exp=0.3 압축 (sub-2-4)', () => {
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

  it('produces TechSpec table values (exp=0.3 전 행성)', () => {
    expect(getVisualRotationPeriod(1407.6)).toBeCloseTo(81.4, 0) // 수성
    expect(getVisualRotationPeriod(-5832.5)).toBeCloseTo(-124.7, 0) // 금성
    expect(getVisualRotationPeriod(23.93)).toBeCloseTo(24, 0) // 지구
    expect(getVisualRotationPeriod(24.62)).toBeCloseTo(24.2, 1) // 화성
    expect(getVisualRotationPeriod(9.93)).toBeCloseTo(18.4, 1) // 목성
    expect(getVisualRotationPeriod(10.66)).toBeCloseTo(18.8, 1) // 토성
    expect(getVisualRotationPeriod(-17.24)).toBeCloseTo(-21.7, 1) // 천왕성
    expect(getVisualRotationPeriod(16.11)).toBeCloseTo(21.3, 1) // 해왕성
    expect(getVisualRotationPeriod(609.12)).toBeCloseTo(63.3, 1) // 태양
  })

  it('is monotonic on positive inputs (큰 real → 큰 visual)', () => {
    expect(getVisualRotationPeriod(9.93)).toBeLessThan(getVisualRotationPeriod(24))
    expect(getVisualRotationPeriod(24)).toBeLessThan(getVisualRotationPeriod(1407.6))
  })
})

describe('getInterpolatedRotationPeriod', () => {
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

  it('수성 진실 도달 시 *멈춤* — 15배 이상 느려진다', () => {
    // visual 81h → real 1407.6h. *PRD §3 의 수성이 멈추는 순간*
    const start = getInterpolatedRotationPeriod(1407.6, 'real', 0)
    const end = getInterpolatedRotationPeriod(1407.6, 'real', 1)
    expect(start).toBeCloseTo(81.4, 0)
    expect(end).toBeCloseTo(1407.6, 0)
    expect(end / start).toBeGreaterThan(15)
  })

  it('목성 진실 도달 시 *광속* — 1.8배 이상 빨라진다', () => {
    // visual 18.4h → real 9.93h. *PRD §3 의 목성이 가속되는 순간*
    const start = getInterpolatedRotationPeriod(9.93, 'real', 0)
    const end = getInterpolatedRotationPeriod(9.93, 'real', 1)
    expect(start).toBeCloseTo(18.4, 1)
    expect(end).toBeCloseTo(9.93, 1)
    expect(start / end).toBeGreaterThan(1.8)
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
    const interpolated = getInterpolatedRotationPeriod(-5832.5, 'real', 0.5)
    expect(interpolated).toBeLessThan(0)
    const effective = getEffectiveRotationPeriod(interpolated, 177.4)
    expect(effective).toBeGreaterThan(0)
  })

  it('지구 보간 중 합성 — 정상 case 부호 그대로', () => {
    const interpolated = getInterpolatedRotationPeriod(23.93, 'real', 0.5)
    const effective = getEffectiveRotationPeriod(interpolated, 23.5)
    expect(effective).toBeGreaterThan(0)
  })
})
