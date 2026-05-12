import { create } from 'zustand'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 시간 컨트롤 store. Canvas 안(useFrame) 과 밖(ControlPanel) 의 공유 메모리.
 *
 * ─── 시간 매핑 ───────────────────────────────────────
 *   1 real second × timeSpeed = N simulation days
 *     timeSpeed = 1      → 지구 1년 ≈ 365초 (6분)
 *     timeSpeed = 100    → 지구 1년 ≈ 3.65초
 *     timeSpeed = 10000  → 지구 1년 ≈ 36ms (블러)
 *     timeSpeed = 100000 → 해왕성 165년 ≈ 0.6초 (보이는 한계)
 *
 * ─── 정지의 의미 ─────────────────────────────────────
 *   timeSpeed === 0 → 정지 상태
 *   prevSpeed       → 정지 직전 활성 속도 (재개 시 복귀)
 *
 *   비디오 플레이어의 ⏸ 와 같은 시맨틱: *현재 속도를 잃지 않고 잠시 멈춤*.
 *   사용자가 정지 중에 다른 속도 버튼을 누르면 자동 재생.
 *
 * ─── useFrame 안 사용 패턴 ─────────────────────────
 *   useFrame 안에서는 *반드시* `useSolarSystemStore.getState()` 호출.
 *   selector 구독 (useSolarSystemStore(s => s.x)) 금지 — 매 프레임 리렌더 폭탄.
 */

export const SPEED_OPTIONS = [1, 100, 10000, 100000] as const
export type SpeedOption = (typeof SPEED_OPTIONS)[number]
export const DEFAULT_SPEED: SpeedOption = 1

interface SolarSystemStore {
  /** 누적 시뮬레이션 시간 (단위: days). 0 = 페이지 진입 시점. */
  simulationDays: number

  /** 현재 시간 속도. 0 = 정지, 그 외 = days per real second. */
  timeSpeed: number

  /** 정지 직전 활성 속도. 재개 시 복귀 대상. */
  prevSpeed: SpeedOption

  /** 활성 속도로 변경. 정지 중이었어도 자동 재생. */
  setTimeSpeed: (speed: SpeedOption) => void

  /** 정지 ↔ 재개 토글. */
  togglePause: () => void

  /** simulationDays=0, timeSpeed=1, prevSpeed=1. 카메라 리셋은 sub-2-5 별도. */
  reset: () => void

  /**
   * 매 프레임 <TimeAdvancer /> 에서 호출.
   * 정지 상태면 no-op. 활성이면 simulationDays 누적.
   */
  advanceTime: (deltaSeconds: number) => void
}

export const useSolarSystemStore = create<SolarSystemStore>((set, get) => ({
  simulationDays: 0,
  timeSpeed: DEFAULT_SPEED,
  prevSpeed: DEFAULT_SPEED,

  setTimeSpeed: (speed) => {
    set({ timeSpeed: speed, prevSpeed: speed })
  },

  togglePause: () => {
    const { timeSpeed, prevSpeed } = get()
    if (timeSpeed === 0) {
      // 정지 → 재개
      set({ timeSpeed: prevSpeed })
    } else {
      // 활성 → 정지 (현재 속도 기억)
      set({ prevSpeed: timeSpeed as SpeedOption, timeSpeed: 0 })
    }
  },

  reset: () => {
    set({
      simulationDays: 0,
      timeSpeed: DEFAULT_SPEED,
      prevSpeed: DEFAULT_SPEED,
    })
  },

  advanceTime: (deltaSeconds) => {
    const { timeSpeed } = get()
    if (timeSpeed === 0) return
    set((s) => ({
      simulationDays: s.simulationDays + deltaSeconds * timeSpeed,
    }))
  },
}))
