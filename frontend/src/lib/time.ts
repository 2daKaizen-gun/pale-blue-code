/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 시간 기반 각도 계산의 단일 진실. store 의 simulationDays ↔ 천체의 회전 각도.
 *
 * ─── sub-2-4 [Light 9.5] 갱신 ──────────────────────
 *   사용자 피드백: *자전 토글 임팩트가 약함, 수성 멈추는 게 안 느껴짐*.
 *
 *   진단:
 *     기존 sqrt 압축 (exp=0.5):
 *       수성 1407.6h → visual 184h (1초당 13% 회전)
 *       real 1407.6h (1초당 1.7%)
 *       비율 7.6배 — 수성 visual 도 이미 *너무 느려* real 차이 인지 어려움
 *
 *   해결:
 *     압축 강도 ↑ (exp=0.5 → 0.3):
 *       수성 visual 184h → 81h (1초당 30% 회전 — *분명히 도는* 속도)
 *       real → 1407.6h (1초당 1.7%) 그대로
 *       비율 17배 — *수성이 잘 돌다가 멈추는* 임팩트
 *     목성 visual 15.4h → 18.5h (현재보다 살짝 느려져, real 9.93h 와의 차이 키움)
 *     지구 24h 거의 그대로 (기준점 보존, exp 변경에 둔감)
 */

import { lerp } from './easing'

const TWO_PI = 2 * Math.PI
const HOURS_PER_DAY = 24

/** sub-2-4 [Light 9.5] visual 자전 압축 강도. 0.5 (sqrt) 에서 강화. */
const VISUAL_COMPRESSION_EXPONENT = 0.3

/**
 * 자전 토글 (sub-2-4) 의 두 모드.
 *   - 'visual': 부호 보존 압축 (exp=0.3). 케플러 비례 *완화하되 보존*
 *   - 'real':   NASA 원본. *수성이 멈추고 목성이 광속이 되는 1초*
 */
export type RotationMode = 'visual' | 'real'

/** 공전 각도. xz 평면 (황도면) 의 회전. */
export function computeOrbitAngle(
  simulationDays: number,
  orbitalPeriodDays: number,
  initialAngle: number,
): number {
  return initialAngle + (simulationDays / orbitalPeriodDays) * TWO_PI
}

/**
 * 자전 각도. y축 회전.
 * 음수 rotationPeriodHours = 역회전. 부호 자연 전파.
 */
export function computeRotationAngle(
  simulationDays: number,
  rotationPeriodHours: number,
): number {
  const periodDays = rotationPeriodHours / HOURS_PER_DAY
  return (simulationDays / periodDays) * TWO_PI
}

/**
 * 시각화 보정용 *효과적* 자전 주기 계산.
 *
 * NASA Fact Sheet 는 *축 기울기* + *자전 주기 부호* 둘로 회전 방향 표현.
 * 예) 금성 axialTilt=177.4°, rotationPeriod=-5832.5h
 *
 * Three.js group 회전 적용 시 두 부호가 *수학적으로 캔슬* — 같은 방향 회전처럼 보임.
 * 보정: axialTilt 가 90~270° 면 좌표계 뒤집힘 → period 부호 반전.
 */
export function getEffectiveRotationPeriod(
  rotationPeriodHours: number,
  axialTiltDeg: number,
): number {
  const isFlipped = axialTiltDeg > 90 && axialTiltDeg < 270
  return isFlipped ? -rotationPeriodHours : rotationPeriodHours
}

/**
 * NASA 원본 자전 주기 → *시각적* 자전 주기 (부호 보존 압축).
 *
 * 공식: `sign(period) × (|period| / 24)^VISUAL_COMPRESSION_EXPONENT × 24`
 *
 * exp=0.3 (sub-2-4 Light 9.5):
 *   24h (지구) 가 기준점 — 거의 불변
 *   수성 1407.6h → 81h    (17배 압축)
 *   금성 -5832.5h → -125h (47배 압축)
 *   목성 9.93h → 18.5h    (1.9배 팽창)
 *
 * 결과: 케플러 비례를 *완화하되 보존*. visual 모드에서 *모든 행성이 보이는 속도로 회전*.
 *
 * 부호 보존: 금성/천왕성 역회전이 visual 모드에서도 유지.
 *
 * 보간은 getInterpolatedRotationPeriod 가 담당.
 */
export function getVisualRotationPeriod(realPeriodHours: number): number {
  if (realPeriodHours === 0) return 0
  const sign = Math.sign(realPeriodHours)
  const magnitude = Math.abs(realPeriodHours)
  return (
    sign *
    Math.pow(magnitude / HOURS_PER_DAY, VISUAL_COMPRESSION_EXPONENT) *
    HOURS_PER_DAY
  )
}

/**
 * sub-2-4 자전 토글의 *보간된 자전 주기* 도출.
 *
 * scale.ts 의 getInterpolatedScaleConfig 와 정확한 미러:
 *   mode='real' 토글 직후 → progress=0 visual 값, progress=1 real 값
 *   mode='visual' 정반대
 *
 *   부호 보존:
 *     금성 (-5832.5h) → visual (-125h) → 보간 중 항상 음수
 *     역회전 일관 유지.
 *
 * 축 기울기 보정 (axial-flip) 은 이 함수 *후* 호출 측에서 합성.
 *
 * @param realPeriodHours - NASA 원본
 * @param mode - 도달 목표 모드
 * @param progress - eased 0~1
 * @returns 그 순간의 자전 주기 (시간, 부호 보존)
 */
export function getInterpolatedRotationPeriod(
  realPeriodHours: number,
  mode: RotationMode,
  progress: number,
): number {
  if (realPeriodHours === 0) return 0
  const visual = getVisualRotationPeriod(realPeriodHours)
  return mode === 'real'
    ? lerp(visual, realPeriodHours, progress)
    : lerp(realPeriodHours, visual, progress)
}
