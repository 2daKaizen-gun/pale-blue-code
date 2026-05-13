import { useFrame } from '@react-three/fiber'
import { useSolarSystemStore } from '../../store/solarSystemStore'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * TimeAdvancer — 매 프레임 simulationDays 를 누적시키는 *단 한 곳*.
 *
 * ─── 왜 별도 컴포넌트인가 ──────────────────────────
 *   Scene 안 useFrame 으로 직접 쓸 수도 있지만:
 *   1. *책임 단일화* — *시간 진행* 이라는 한 가지만 함
 *   2. *순서 보장* — Scene 의 첫 자식으로 두면 다른 useFrame 보다 먼저 실행.
 *      그 프레임의 simulationDays 가 갱신된 채로 Planet/Sun/Ring 이 읽음.
 *   3. *테스트성* — 향후 *시간 진행 일시중단* 같은 디버그 기능 붙일 때 한 곳에서 처리
 *
 * ─── 리렌더 0 보장 ──────────────────────────────────
 *   getState().advanceTime(delta) → store 내부 set 호출.
 *   simulationDays 를 구독하는 컴포넌트는 *0개* (모두 useFrame 안에서 getState) →
 *   Zustand 가 통지할 구독자가 없음 → React 리렌더 0건. 매 프레임 호출해도 무해.
 *
 * ─── null 반환 ─────────────────────────────────────
 *   시각 요소 없음 — 순수 *훅 호스팅* 컴포넌트. R3F 가 빈 자식 잘 처리.
 */
export function TimeAdvancer() {
  useFrame((_, delta) => {
    useSolarSystemStore.getState().advanceTime(delta)
  })
  return null
}
