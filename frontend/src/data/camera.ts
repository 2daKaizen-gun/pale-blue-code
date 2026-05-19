/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 카메라 home 위치 — 자유 카메라 시작점, [🎥 카메라 리셋] 복귀 목표.
 *
 * sub-2-2 [Light 9] 손튜닝 결과: distanceScale=20 기준 해왕성 거리 109 까지 한 화면.
 *
 * 단일 source of truth — Scene 의 Canvas 초기 camera position + CameraController 의
 * home 보간 목표 둘 다 여기서 import. 페이지 진입 직후 reset 호출 시 *from = to = home*
 * 이라 0 보간 (변화 없음).
 *
 * 튜플 [number, number, number] 로 두는 이유: THREE.Vector3 직접 두면 mutable
 * 위험 (다른 곳에서 .set() 호출 시 home 자체 변경). 컴포넌트에서 new Vector3()
 * 매번 만듦.
 */

/** 카메라 home 위치 (월드 좌표). */
export const CAMERA_HOME_POSITION: readonly [number, number, number] = [
  0, 60, 150,
] as const

/**
 * 카메라 home target — 어디를 보는가. 태양 (원점) 향함.
 *
 * 태양계의 본질은 *태양 중심 시스템* — 자유 카메라가 *태양 중심* 을 향함이 자연.
 * 코페르니쿠스 1543년 이후 인류가 합의한 시점.
 */
export const CAMERA_HOME_TARGET: readonly [number, number, number] = [
  0, 0, 0,
] as const
