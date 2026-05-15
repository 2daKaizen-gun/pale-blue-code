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
 *   호출 측 (Planet.tsx) 에서 다음 순서로 합성:
 *     realPeriod                                            // NASA 원본
 *     → getVisualRotationPeriod(realPeriod)                // visual 압축 (부호 보존)
 *     → lerp(visual, real, easeInOutCubic(progress))       // mode 보간
 *     → getEffectiveRotationPeriod(period, tilt)           // axial-flip 보정
 *     → computeRotationAngle(days, effective)              // 각도
 *
 *   왜 *visual 먼저, effective 나중* 인가:
 *     visual = 데이터 본질의 압축 (스피드의 크기 — 케플러 비례 완화)
 *     effective = 좌표계 부산물 보정 (시각적 부호 캔슬 상쇄)
 *   두 책임이 의미적으로 다르므로 분리. 결과는 어느 순서든 수학적으로 동일.
 */

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
 *
 * @param simulationDays - store 누적 시뮬레이션 시간 (days)
 * @param orbitalPeriodDays - 천체의 실제 공전 주기 (data/planets.ts)
 * @param initialAngle - t=0 시점의 시작 각도 (Scene 에서 행성마다 다르게 부여)
 * @returns 라디안 단위 각도 (modulo X)
 */
export function computeOrbitAngle(
  simulationDays: number,
  orbitalPeriodDays: number,
  initialAngle: number,
): number {
  return initialAngle + (simulationDays / orbitalPeriodDays) * TWO_PI
}

/**
 * 자전 각도. y축 (자전축 기울기 적용 후의 그 축) 회전.
 *
 * 음수 rotationPeriodHours = 역회전 (금성 -5832.5h, 천왕성 -17.24h).
 * 부호가 결과 각도로 자연스럽게 전파 — Planet.tsx 의 direction 변수 제거 가능.
 *
 * @param simulationDays - store 누적 시뮬레이션 시간 (days)
 * @param rotationPeriodHours - 자전 주기 시간 단위 (음수 가능)
 * @returns 라디안 단위 각도
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
 * 두 부호 중 하나만 적용하면 정확함. 우리는 좌표계 뒤집기를 시각적 임팩트 (특히 천왕성
 * 의 *옆으로 누운 자전*) 위해 유지하고, 회전 부호를 보정하는 쪽 선택.
 *
 * @param rotationPeriodHours - NASA 원본 값 (data/planets.ts)
 * @param axialTiltDeg - 자전축 기울기 (0~180° 범위 예상)
 * @returns 시각화에 적용할 보정된 주기
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
 *   24h (지구) 가 *불변 기준점* — 지구는 거의 그대로 (23.93h → 23.96h)
 *   24h 보다 *큰* 주기 (느린 자전) → 압축됨   : 수성 1407.6h → 184h
 *   24h 보다 *작은* 주기 (빠른 자전) → 팽창됨 : 목성 9.93h → 15.4h
 *
 * 결과: 케플러 비례를 *완화하되 보존*. 1x 에서 수성/목성이 둘 다 *보이는* 속도.
 * lib/scale.ts 의 distanceExponent 0.5 와 *수학적으로 같은 압축* — 같은 결.
 *
 * sub-2-4 자전 토글 'visual' 모드의 값. 'real' 모드는 원본 그대로.
 * 보간은 호출 측 (Planet.tsx) 의 lerp(visual, real, eased) — 이 함수는 visual 만 책임.
 *
 * 부호 보존: 금성 -5832.5h → -374h. 역회전이 *visual 모드에서도* 유지됨.
 *
 * @param realPeriodHours - NASA 원본 (data/planets.ts 의 rotationPeriod_hours)
 * @returns 시각 모드 자전 주기 (시간 단위, 음수 가능)
 */
export function getVisualRotationPeriod(realPeriodHours: number): number {
  if (realPeriodHours === 0) return 0
  const sign = Math.sign(realPeriodHours)
  const magnitude = Math.abs(realPeriodHours)
  return sign * Math.sqrt(magnitude / HOURS_PER_DAY) * HOURS_PER_DAY
}
