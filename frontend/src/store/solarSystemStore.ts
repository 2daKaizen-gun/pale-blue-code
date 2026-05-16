import { create } from 'zustand'
import type { ScaleMode } from '../lib/scale'
import type { RotationMode } from '../lib/time'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 시간 + 진실 토글 store. Canvas 안(useFrame) 과 밖(ControlPanel) 의 공유 메모리.
 *
 * ─── 시간 매핑 ───────────────────────────────────────
 *   1 real second × timeSpeed = N simulation days
 *     timeSpeed = 0.1   → 지구 자전 10초/회전, *느림의 관찰*
 *     timeSpeed = 1     → 지구 1년 ≈ 365초 (6분)
 *     timeSpeed = 100   → 지구 1년 ≈ 3.65초, 내행성 공전 관찰
 *     timeSpeed = 10000 → 해왕성 1바퀴 6초, 외행성까지 한 화면
 *
 *   sub-2-3 [Light 8.5] 갱신: 100,000× 제거 (인간 눈에 의미 없음) + 0.1× 추가
 *   (느린 자전 관찰). 빠름과 느림 양쪽으로 학습 가치.
 *
 * ─── 정지의 의미 ─────────────────────────────────────
 *   timeSpeed === 0 → 정지 상태
 *   prevSpeed       → 정지 직전 활성 속도 (재개 시 복귀)
 *
 * ─── 진실 토글 패러다임 (sub-2-4) ──────────────────────
 *   *store 에 progress 를 저장하지 않는다.* mode + changedAt 2쌍만 보관.
 *   매 프레임 컴포넌트가 (performance.now() - changedAt) / 1500 으로 progress 도출.
 *
 *   왜:
 *     - 매 프레임 setState 0 → sub-2-3 의 *useFrame 안 리렌더 0* 보장 유지
 *     - 정지/리셋이 보간 중에도 자연 작동 (sub-2-3 *증분→절대* 패러다임 확장)
 *     - 중복 토글 자동 방어: changedAt 만 새로 세팅 → 진행 중 보간이 새 시점에서 재시작
 *     - 프리셋의 *동시성* 확보: 두 changedAt 에 동일 timestamp → 양쪽 progress 동기
 *
 *   초기값 -Infinity: 페이지 진입 시 *이미 visual 도달 상태* 의미 (progress = 1).
 *
 * ─── useFrame 안 사용 패턴 ─────────────────────────
 *   useFrame 안에서는 *반드시* `useSolarSystemStore.getState()` 호출.
 *   selector 구독 금지 — 매 프레임 리렌더 폭탄.
 */

export const SPEED_OPTIONS = [0.1, 1, 100, 10_000] as const
export type SpeedOption = (typeof SPEED_OPTIONS)[number]
export const DEFAULT_SPEED: SpeedOption = 1

/** sub-2-4 보간 총 시간 (ms). easeInOutCubic 1.5초. */
export const TRANSITION_DURATION_MS = 1500

interface SolarSystemStore {
  // ─── 시간 (sub-2-3) ──────────────────────────────
  /** 누적 시뮬레이션 시간 (단위: days). 0 = 페이지 진입 시점. */
  simulationDays: number

  /** 현재 시간 속도. 0 = 정지, 그 외 = days per real second. */
  timeSpeed: number

  /** 정지 직전 활성 속도. 재개 시 복귀 대상. */
  prevSpeed: SpeedOption

  // ─── 진실 토글 (sub-2-4) ─────────────────────────
  /** 거리 토글의 *현재 목표* 모드. */
  scaleMode: ScaleMode

  /** scaleMode 가 마지막으로 변경된 시각 (performance.now() ms). */
  scaleModeChangedAt: number

  /** 자전 토글의 *현재 목표* 모드. */
  rotationMode: RotationMode

  /** rotationMode 가 마지막으로 변경된 시각 (performance.now() ms). */
  rotationModeChangedAt: number

  // ─── 액션 ────────────────────────────────────────
  /** 활성 속도로 변경. 정지 중이었어도 자동 재생. */
  setTimeSpeed: (speed: SpeedOption) => void

  /** 정지 ↔ 재개 토글. */
  togglePause: () => void

  /** simulationDays=0, timeSpeed=1, prevSpeed=1. 카메라 리셋은 sub-2-5 별도. */
  reset: () => void

  /**
   * *모든 것* 리셋 — 페이지 mount 시점에 자동 호출 (F5 / Vite HMR 모두 커버).
   *
   * `reset` 과 차이:
   *   reset    = 시간만 (사용자 명시 액션 — R 버튼 / ↺ 클릭)
   *   resetAll = 시간 + 진실 모드 둘 다 (페이지 진입 시점 자동)
   *
   * 왜 분리:
   *   사용자가 *진실 모드 보면서 시간만 되감기* 케이스 흔함 → reset 이 모드 건드리면 X.
   *   페이지 진입 시점에는 *깨끗한 visual 모드* 가 PRD §3 *60초 시나리오의 0~10s* 의도.
   */
  resetAll: () => void

  /**
   * 매 프레임 <TimeAdvancer /> 에서 호출.
   * 정지 상태면 no-op. 활성이면 simulationDays 누적.
   */
  advanceTime: (deltaSeconds: number) => void

  /** 거리 토글. mode 반전 + changedAt 갱신. */
  toggleScaleMode: () => void

  /** 자전 토글. mode 반전 + changedAt 갱신. */
  toggleRotationMode: () => void

  /**
   * 전체 진실 프리셋.
   *   - 둘 다 real 이면 → 둘 다 visual (탈출 경로)
   *   - 아니면         → 둘 다 real
   *   양쪽 changedAt 에 *동일 timestamp* 세팅 → 두 보간 정확 동기.
   *
   *   *PRD §3 의 영혼: 교육적 거짓말이 진실로 동시에 무너지는 순간.*
   */
  toggleAllTruth: () => void
}

export const useSolarSystemStore = create<SolarSystemStore>((set, get) => ({
  simulationDays: 0,
  timeSpeed: DEFAULT_SPEED,
  prevSpeed: DEFAULT_SPEED,

  scaleMode: 'visual',
  scaleModeChangedAt: -Infinity, // 이미 도달 상태 = progress 1
  rotationMode: 'visual',
  rotationModeChangedAt: -Infinity,

  setTimeSpeed: (speed) => {
    set({ timeSpeed: speed, prevSpeed: speed })
  },

  togglePause: () => {
    const { timeSpeed, prevSpeed } = get()
    if (timeSpeed === 0) {
      set({ timeSpeed: prevSpeed })
    } else {
      set({ prevSpeed: timeSpeed as SpeedOption, timeSpeed: 0 })
    }
  },

  reset: () => {
    set({
      simulationDays: 0,
      timeSpeed: DEFAULT_SPEED,
      prevSpeed: DEFAULT_SPEED,
      // 모드는 리셋하지 않음 — 사용자가 진실 모드 본 후 시간만 리셋하는 케이스 흔함
    })
  },

  resetAll: () => {
    set({
      simulationDays: 0,
      timeSpeed: DEFAULT_SPEED,
      prevSpeed: DEFAULT_SPEED,
      scaleMode: 'visual',
      scaleModeChangedAt: -Infinity,
      rotationMode: 'visual',
      rotationModeChangedAt: -Infinity,
    })
  },

  advanceTime: (deltaSeconds) => {
    const { timeSpeed } = get()
    if (timeSpeed === 0) return
    set((s) => ({
      simulationDays: s.simulationDays + deltaSeconds * timeSpeed,
    }))
  },

  toggleScaleMode: () => {
    const { scaleMode } = get()
    set({
      scaleMode: scaleMode === 'visual' ? 'real' : 'visual',
      scaleModeChangedAt: performance.now(),
    })
  },

  toggleRotationMode: () => {
    const { rotationMode } = get()
    set({
      rotationMode: rotationMode === 'visual' ? 'real' : 'visual',
      rotationModeChangedAt: performance.now(),
    })
  },

  toggleAllTruth: () => {
    const { scaleMode, rotationMode } = get()
    const allTruth = scaleMode === 'real' && rotationMode === 'real'
    const target: ScaleMode = allTruth ? 'visual' : 'real'
    const now = performance.now()
    set({
      scaleMode: target,
      rotationMode: target,
      scaleModeChangedAt: now,
      rotationModeChangedAt: now,
    })
  },
}))
