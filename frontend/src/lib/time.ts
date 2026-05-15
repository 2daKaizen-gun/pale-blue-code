/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 시간 기반 각도 계산의 단일 진실. store 의 simulationDays ↔ 천체의 회전 각도.
 *
 * 순수 함수만. side effect 없음 → TDD 적합. lib/scale.ts 의
 * computeVisualRadius/Distance 와 같은 격: data → number 단방향.
 *
 * ─── 부호 규약 ───────────────────────────────────────
 *   양수 각도 = 시계 반대 방향 (수학 관례).
 *   금성처럼 rotationPeriod_hours 가 음수면 결과 각도도 음수 → 역회전.
 *   부호가 *방향 + 속도* 를 한 숫자에 통합 — 별도 direction prop 불필요해짐.
 *
 *   결과는 modulo 처리하지 않음. 호출자가 mesh.rotation 에 박으면 Three.js 가
 *   내부적으로 wrap. simulationDays 가 매우 커지면 Math.cos/sin 정밀도 손실
 *   여지 있지만, JS double 의 15 유효숫자 안에서 *수 시간 단위 사용* 까지는 무영향.
 *
 * ─── 합성 순서 (sub-2-4 자전 토글) ─────────────────────
 *   호출 측 (Planet.tsx 등) 에서 다음 순서로 합성:
 *     realPeriod                                            // NASA 원본
 *     → getInterpolatedRotationPeriod(real, mode, eased)    // mode 보간 (visual ↔ real)
 *     → getEffectiveRotationPeriod(period, tilt)            // axial-flip 보정
 *     → computeRotationAngle(days, effective)               // 각도
 *
 *   왜 *보간 먼저, 보정 나중* 인가:
 *     보간 = 데이터 본질의 변환 (visual ↔ real)
 *     보정 = 좌표계 부산물 (시각적 부호 캔슬 상쇄)
 *   두 책임이 의미적으로 다르므로 분리.
 */

import { lerp } from './easing'

const TWO_PI = 2 * Math.PI
const HOURS_PER_DAY = 24

/**
 * 자전 토글 (sub-2-4) 의 두 모드.
 *   - 'visual': 부호 보존 sqrt 압축. 케플러 비례 *완화하되 보존*
 *   - 'real':   NASA 원본 값. *수성이 멈추고 목성이 광속이 되는 1초*
 */
export type RotationMode = 'visual' | 'real'

/**
 * 공전 각도. xz 평면 (황도면) 의 회전.
 */
export function computeOrbitAngle(
  simulationDays: number,
  orbitalPeriodDays: number,
  initialAngle: number,
): number {
  return initialAngle + (simulationDays / orbitalPeriodDays) * TWO_PI
}

/**
 * 자전 각도. y축 회전.
 * 음수 rotationPeriodHours = 역회전 (금성, 천왕성). 부호 자연 전파.
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
 * NASA Fact Sheet 는 *축 기울기* + *자전 주기 부호* 두 가지로 회전 방향을 표현.
 * 예) 금성 axialTilt=177.4°, rotationPeriod=-5832.5h → *둘 다* 시계 방향 표현
 *
 * 그런데 Three.js 의 group 회전을 그대로 적용하면 두 부호가 *수학적으로 캔슬* 됨:
 *   - axialTilt 177.4° → z축 거의 180° 회전 → 좌표계가 위아래로 뒤집힘
 *   - 뒤집힌 좌표계에서 mesh.rotation.y 음수 회전 → 외부 관찰자엔 *양수 회전* 으로 보임
 *   - 결과: 다른 행성과 같은 방향으로 자전하는 듯한 *시각적 버그*
 *
 * 보정: axialTilt 가 90~270° 범위에 있으면 좌표계가 뒤집힌 것 → period 부호 반전으로 상쇄.
 *
 * 비유: *지구본을 거꾸로 들고 시계 반대 방향으로 돌리면 보는 사람한텐 시계 방향*.
 */
export function getEffectiveRotationPeriod(
  rotationPeriodHours: number,
  axialTiltDeg: number,
): number {
  const isFlipped = axialTiltDeg > 90 && axialTiltDeg < 270
  return isFlipped ? -rotationPeriodHours : rotationPeriodHours
}

/**
 * NASA 원본 자전 주기 → *시각적* 자전 주기 (부호 보존 sqrt 압축).
 *
 * 공식: `sign(period) × (|period| / 24)^0.5 × 24`
 *
 * 의미:
 *   24h (지구) 가 *불변 기준점*
 *   24h 보다 *큰* 주기 (느린 자전) → 압축됨   : 수성 1407.6h → 184h
 *   24h 보다 *작은* 주기 (빠른 자전) → 팽창됨 : 목성 9.93h → 15.4h
 *
 * 결과: 케플러 비례를 *완화하되 보존*. 1x 에서 수성/목성이 둘 다 *보이는* 속도.
 *
 * sub-2-4 자전 토글 'visual' 모드의 값. 'real' 모드는 원본 그대로.
 * 보간은 getInterpolatedRotationPeriod 가 담당.
 */
export function getVisualRotationPeriod(realPeriodHours: number): number {
  if (realPeriodHours === 0) return 0
  const sign = Math.sign(realPeriodHours)
  const magnitude = Math.abs(realPeriodHours)
  return sign * Math.sqrt(magnitude / HOURS_PER_DAY) * HOURS_PER_DAY
}

/**
 * sub-2-4 자전 토글의 *보간된 자전 주기* 도출.
 *
 * scale.ts 의 getInterpolatedScaleConfig 와 정확한 미러:
 *   mode='real' 토글 직후 → 직전엔 visual. progress=0 시점에 visual 값.
 *   progress=1 시점에 real 값 도달. 1.5초 동안 visual → real 부드럽게.
 *   mode='visual' 정반대.
 *
 *   *"mode 는 도달하려는 목표, progress 는 얼마나 갔는가"* — store 패러다임 일치.
 *
 * 부호 보존:
 *   금성 (-5832.5h) → visual (-374h) → 보간 중 항상 음수.
 *   천왕성 (-17.24h) → visual (-20.3h) → 둘 다 음수, 보간 중 음수.
 *   *역회전이 토글 중에도 일관* 유지.
 *
 * 축 기울기 보정 (axial-flip) 은 *이 함수 결과 후* 호출 측에서
 * getEffectiveRotationPeriod 로 합성. 두 책임 분리.
 *
 * @param realPeriodHours - NASA 원본 (data/planets.ts)
 * @param mode - 도달 목표 모드
 * @param progress - eased 0~1 (호출 측에서 easeInOutCubic 적용 후 전달)
 * @returns 그 순간의 자전 주기 (시간 단위, 부호 보존)
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
