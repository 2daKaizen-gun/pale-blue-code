import { useSyncExternalStore } from 'react'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * useIsTouchDevice — coarse pointer(터치) 기기 여부를 반응형으로 판정.
 *
 * `(pointer: coarse)` 미디어 쿼리 = 손가락처럼 *정밀하지 않은* 포인터.
 * 마우스(fine)면 false, 터치스크린이면 true. 외부 모니터 연결/해제처럼
 * 포인터 성격이 바뀌면 useSyncExternalStore 가 리렌더로 따라감.
 *
 * ─── sub-phase 2-7 [L1] 추출 ────────────────────────
 *   원래 ControlPanel 인라인(속도 상한 전용)이었으나, 적응형 품질(L4)에서
 *   Scene/Planet/Starfield 도 같은 판정을 써야 해 hooks/ 로 추출.
 *   *단일 소스* — 터치 판정 로직이 앱 전체에 하나만 존재.
 *
 *   SSR 스냅샷은 false (데스크톱 가정) — 하이드레이션 후 클라이언트에서 정정.
 */

const COARSE_POINTER_QUERY = '(pointer: coarse)'

function subscribeCoarsePointer(callback: () => void): () => void {
  const mq = window.matchMedia(COARSE_POINTER_QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getCoarsePointerSnapshot(): boolean {
  return window.matchMedia(COARSE_POINTER_QUERY).matches
}

function getCoarsePointerServerSnapshot(): boolean {
  return false
}

export function useIsTouchDevice(): boolean {
  return useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  )
}
