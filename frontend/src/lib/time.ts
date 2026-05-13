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
 */

const TWO_PI = 2 * Math.PI
const HOURS_PER_DAY = 24

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
