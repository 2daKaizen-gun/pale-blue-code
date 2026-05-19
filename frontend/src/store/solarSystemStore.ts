import { create } from 'zustand'
import type { ScaleMode } from '../lib/scale'
import type { RotationMode } from '../lib/time'
import type { PlanetId } from '../data/planets'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 시간 + 진실 토글 + 선택 + 카메라 store. Canvas 안(useFrame) 과 밖(ControlPanel) 의 공유 메모리.
 *
 * ─── 시간 매핑 ───────────────────────────────────────
 *   1 real second × timeSpeed = N simulation days
 *     timeSpeed = 0.1   → 지구 자전 10초/회전, *느림의 관찰*
 *     timeSpeed = 1     → 지구 1년 ≈ 365초 (6분)
 *     timeSpeed = 100   → 지구 1년 ≈ 3.65초, 내행성 공전 관찰
 *     timeSpeed = 10000 → 해왕성 1바퀴 6초, 외행성까지 한 화면
 *
 * ─── 정지의 의미 ─────────────────────────────────────
 *   timeSpeed === 0 → 정지 상태
 *   prevSpeed       → 정지 직전 활성 속도 (재개 시 복귀)
 *
 * ─── 진실 토글 패러다임 (sub-2-4) ──────────────────────
 *   *store 에 progress 를 저장하지 않는다.* mode + changedAt 2쌍만 보관.
 *   매 프레임 컴포넌트가 (performance.now() - changedAt) / 1500 으로 progress 도출.
 *   초기값 -Infinity: 페이지 진입 시 *이미 visual 도달 상태* 의미 (progress = 1).
 *
 * ─── 선택 + 카메라 패러다임 (sub-2-5) ───────────────────
 *   selectedBodyId 는 *이산적 의도* 만 store 에 보관. 카메라 위치/target 은
 *   매 프레임 갱신되는 *연속값* 이므로 store 에 두지 않는다 (리렌더 폭탄 방지).
 *   CameraController 가 selectedBodyId 변화를 effect 로 감지해 자체 보간 시작 +
 *   매 프레임 useFrame 안에서 천체 현재 위치 추적.
 *
 *   *Body* 추상: 카메라가 추적할 수 있는 모든 천체 = 8개 행성 + 태양 (+ 미래의 달).
 *
 *   [Light 7] *cameraResetRequestedAt* — home 보간의 *trigger timestamp*:
 *     - performance.now() = home 보간 *시작* (보간 진입)
 *     - -Infinity         = 카메라 자동 제어 *양도* (사용자 OrbitControls 자유)
 *
 *   세 가지 카메라 모드의 store 표현:
 *     [추적]       selectedBodyId != null, cameraResetRequestedAt 무관
 *     [home 보간]  selectedBodyId == null, cameraResetRequestedAt = (최근 timestamp)
 *     [사용자 자유] selectedBodyId == null, cameraResetRequestedAt = -Infinity
 *
 *   CameraController 의 두 useEffect 가 *두 trigger* 를 독립 감지. 작성 순서로
 *   *나중 effect 가 이긴다* — [🎥] 누름이 selectedBodyId=null + cameraResetRequestedAt=now
 *   둘 다 set 하지만 *home 보간 effect* 가 마지막이라 *home 보간* 으로 귀결.
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

/**
 * 카메라가 추적할 수 있는 천체의 합집합 (sub-2-5).
 *
 * 현재: 8개 행성 + 태양. 미래: 'moon' 추가 (sub-2-6 또는 그 이후).
 */
export type BodyId = PlanetId | 'sun'

interface SolarSystemStore {
  // ─── 시간 (sub-2-3) ──────────────────────────────
  simulationDays: number
  timeSpeed: number
  prevSpeed: SpeedOption

  // ─── 진실 토글 (sub-2-4) ─────────────────────────
  scaleMode: ScaleMode
  scaleModeChangedAt: number
  rotationMode: RotationMode
  rotationModeChangedAt: number

  // ─── 선택 + 카메라 (sub-2-5) ─────────────────────
  /**
   * 현재 선택된 천체 ID (카메라 추적 대상). null = 추적 X.
   *
   * *cross-component* 공유 — CameraController, Planet/Sun (selected 라벨 표시).
   */
  selectedBodyId: BodyId | null

  /**
   * 카메라 home 보간 trigger timestamp (sub-2-5 [Light 7]).
   *   - performance.now() (양수) = home 보간 *시작 시점*. CameraController 가
   *     effect 로 감지해 *현재 카메라 위치 → home* 1.5초 보간.
   *   - -Infinity = 카메라 자동 제어 *양도*. CameraController 손 떼기. 사용자가
   *     OrbitControls 만질 때.
   *   - 초기값 -Infinity = 페이지 진입 시 사용자 자유.
   *
   * sub-2-4 의 *mode + changedAt* 결을 이음 — *언제 변화 의도가 발생했는가* 만
   * 보관, 보간 progress 는 매 프레임 derived.
   */
  cameraResetRequestedAt: number

  // ─── 액션 ────────────────────────────────────────
  setTimeSpeed: (speed: SpeedOption) => void
  togglePause: () => void

  /** 천체 선택 (행성 또는 태양). CameraController 가 보간 시작. */
  selectBody: (id: BodyId) => void

  /**
   * 카메라를 home 으로 보간 + 선택 해제. [🎥 카메라 리셋] 버튼이 호출.
   *
   * selectedBodyId 도 함께 null 로 — *home 으로 가는데 추적 ID 가 남아 있으면 어색*.
   * 의미: *카메라를 처음 시점으로*. 시간/모드는 그대로.
   */
  resetCameraView: () => void

  /**
   * 카메라 자동 제어 양도. 사용자가 OrbitControls 만질 때 호출.
   *
   * selectedBodyId=null (추적 정지) + cameraResetRequestedAt=-Infinity (home 보간도 정지).
   * → CameraController 의 두 effect 모두 *손 떼기* 로 귀결. 사용자 자유.
   */
  yieldCameraControl: () => void

  /**
   * 모든 상태 처음으로 — 시간 + 진실 모드 + 선택 + 카메라 넷 다.
   *   simulationDays=0, timeSpeed=1, prevSpeed=1,
   *   scaleMode/rotationMode='visual', 양쪽 changedAt=-Infinity,
   *   selectedBodyId=null,
   *   cameraResetRequestedAt=performance.now() (home 보간 시작).
   *
   * 호출 위치:
   *   - 사용자 [↺] 버튼 / R 키
   *   - ControlPanel mount 시 useEffect (F5 / HMR 후 깨끗한 시작점)
   *
   * 카메라 부분 (Light 7):
   *   - 시간/모드의 changedAt 은 -Infinity (이미 도달 상태) 인 반면,
   *     cameraResetRequestedAt 은 *지금 보간 시작*. 두 의미가 다른 이유:
   *     시간/모드는 *값 자체가 즉시 처음*, 카메라는 *위치가 부드럽게 처음으로 가는 길*.
   *   - 페이지 진입 직후엔 카메라가 이미 home → from=to → 0 보간 (변화 없음). OK.
   *   - HMR 후엔 카메라가 이전 위치일 수 있음 → home 으로 부드럽게 복귀. OK.
   *
   * sub-2-4 의 *통합 reset* 결 + sub-2-5 의 *카메라 리셋 분리* 결을 함께 지킴:
   *   - selection + 카메라 home 보간은 통합 reset 에 포함 (모든 것 처음)
   *   - 그래도 [🎥] 버튼은 별도 — 카메라만 home (시간/모드 유지) 케이스 분리
   */
  reset: () => void

  advanceTime: (deltaSeconds: number) => void
  toggleScaleMode: () => void
  toggleRotationMode: () => void
  toggleAllTruth: () => void
}

export const useSolarSystemStore = create<SolarSystemStore>((set, get) => ({
  simulationDays: 0,
  timeSpeed: DEFAULT_SPEED,
  prevSpeed: DEFAULT_SPEED,

  scaleMode: 'visual',
  scaleModeChangedAt: -Infinity,
  rotationMode: 'visual',
  rotationModeChangedAt: -Infinity,

  selectedBodyId: null,
  cameraResetRequestedAt: -Infinity, // 페이지 진입 시 사용자 자유

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

  selectBody: (id) => {
    set({ selectedBodyId: id })
  },

  resetCameraView: () => {
    set({
      selectedBodyId: null,
      cameraResetRequestedAt: performance.now(),
    })
  },

  yieldCameraControl: () => {
    set({
      selectedBodyId: null,
      cameraResetRequestedAt: -Infinity,
    })
  },

  reset: () => {
    set({
      simulationDays: 0,
      timeSpeed: DEFAULT_SPEED,
      prevSpeed: DEFAULT_SPEED,
      scaleMode: 'visual',
      scaleModeChangedAt: -Infinity,
      rotationMode: 'visual',
      rotationModeChangedAt: -Infinity,
      selectedBodyId: null,
      cameraResetRequestedAt: performance.now(),
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
