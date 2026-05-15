/**
 * 보간 곡선 (easing functions).
 *
 * progress 0~1 을 받아 *가속-감속* 매핑한 0~1 을 반환.
 * sub-2-4 의 진실 토글 1.5초 보간 (거리 + 자전 + 프리셋) 공용.
 *
 * 왜 easeInOutCubic 인가:
 *   - 양 끝 도함수 0 → 시작/종료가 *멈춤* 으로 느껴짐 (linear 의 *툭 끊김* 회피)
 *   - 중간 도함수 최대 → *변화의 한가운데* 가 또렷함 (지구가 점이 되는 순간이 임팩트)
 *   - 산업 표준 (GSAP, Framer, CSS `ease-in-out` 의 사실상 디폴트)
 */

/**
 * easeInOutCubic — 3차 가속-감속 곡선.
 *
 * @param t 정규화된 진행도 (clamped 0~1, 범위 밖은 호출 측에서 clamp 가정)
 * @returns 보간된 0~1
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * 두 값 사이를 progress 로 *선형* 보간.
 *
 * easing 곡선과 분리해두면 호출 측에서:
 *   const eased = easeInOutCubic(rawProgress)
 *   const value = lerp(from, to, eased)
 * 처럼 *곡선 ↔ 보간* 책임을 나눠 쓸 수 있다.
 */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/**
 * 토글 누른 시각 (`changedAt`) 과 현재 시각 (`now`) 로부터 *clamped* progress 계산.
 *
 * 패러다임 메모:
 *   sub-2-3 의 *증분 → 절대* 와 같은 결.
 *   store 에 progress 를 *저장* 하지 않고, changedAt 만 두고 매 프레임 *계산*.
 *   매 프레임 setState 0 → 리렌더 0 (sub-2-3 의 useFrame 보장 유지).
 *
 * @param now         현재 시각 (ms, 보통 performance.now())
 * @param changedAt   토글 누른 시각 (ms)
 * @param durationMs  보간 총 시간 (sub-2-4 = 1500)
 * @returns 0 ≤ progress ≤ 1
 */
export function computeTransitionProgress(
  now: number,
  changedAt: number,
  durationMs: number,
): number {
  if (durationMs <= 0) return 1
  const elapsed = now - changedAt
  if (elapsed <= 0) return 0
  if (elapsed >= durationMs) return 1
  return elapsed / durationMs
}
