import { useEffect, useSyncExternalStore } from 'react'
import {
  useSolarSystemStore,
  SPEED_OPTIONS,
  type SpeedOption,
} from '../../store/solarSystemStore'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * ControlPanel — 사용자가 시간 + 진실 모드를 조작하는 도구. Canvas 밖, 화면 하단 고정.
 *
 * ─── 레이아웃 (sub-2-4 갱신) ─────────────────────────
 *   [정지] | [속도 4개] | [거리] [자전] [전체 진실] | [리셋]
 *      시간 그룹                    진실 토글 그룹      reset
 *
 *   *시간* 은 일시적 (스페이스 한 번이면 복원), *모드* 는 영구적 (다음 토글까지 유지).
 *   다른 의미라 시각적으로 분리 (구분선).
 *
 * ─── 키보드 단축키 ─────────────────────────────────
 *   Space: 정지/재생
 *   1/2/3/4: 0.1× / 1× / 100× / 10,000×
 *   R: 리셋
 *   *<input>/<textarea> 포커스 중에는 무시*
 *
 *   모드 토글 단축키 (D=거리/T=자전/A=전체) 는 sub-2-5 또는 sub-2-6 별도.
 *
 * ─── 진실 토글 UX (sub-2-4) ────────────────────────
 *   각 토글 활성 (mode='real') 시 bg-white/20 — 사용자가 *지금 진실 모드* 임을 시각 인지.
 *   비활성 (mode='visual') 은 기본 상태 (어두운 우주 배경).
 *   *전체 진실* 은 양쪽 모드 모두 'real' 일 때만 활성 표시 (= 둘 다 진실 상태).
 *
 * ─── 모바일 속도 제한 ──────────────────────────────
 *   현재 SPEED_OPTIONS 최대값이 10,000× 라 실효 제한 없음.
 *   인프라는 sub-2-7 모바일 최적화 위해 유지.
 *
 * ─── 리셋의 책임 범위 ──────────────────────────────
 *   *시간만* 리셋. 모드/카메라는 별도. 카메라 리셋은 sub-2-5.
 */

const MOBILE_MAX_SPEED = 10_000
const COARSE_POINTER_QUERY = '(pointer: coarse)'

function formatSpeed(speed: SpeedOption): string {
  return `${speed.toLocaleString('en-US')}×`
}

// ─── useSyncExternalStore: 외부 source (matchMedia) 와 정확 동기화 ──
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

function useIsTouchDevice(): boolean {
  return useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  )
}

export function ControlPanel() {
  // ── 시간 컨트롤 (sub-2-3) ────────────────────────
  const currentSpeed = useSolarSystemStore((s) => s.timeSpeed)
  const togglePause = useSolarSystemStore((s) => s.togglePause)
  const setTimeSpeed = useSolarSystemStore((s) => s.setTimeSpeed)
  const reset = useSolarSystemStore((s) => s.reset)
  const isPaused = currentSpeed === 0

  // ── 진실 토글 (sub-2-4) ──────────────────────────
  const scaleMode = useSolarSystemStore((s) => s.scaleMode)
  const rotationMode = useSolarSystemStore((s) => s.rotationMode)
  const toggleScaleMode = useSolarSystemStore((s) => s.toggleScaleMode)
  const toggleRotationMode = useSolarSystemStore((s) => s.toggleRotationMode)
  const toggleAllTruth = useSolarSystemStore((s) => s.toggleAllTruth)
  const isScaleReal = scaleMode === 'real'
  const isRotationReal = rotationMode === 'real'
  const isAllTruth = isScaleReal && isRotationReal

  const isTouch = useIsTouchDevice()
  const availableSpeeds: readonly SpeedOption[] = isTouch
    ? SPEED_OPTIONS.filter((s) => s <= MOBILE_MAX_SPEED)
    : SPEED_OPTIONS

  // ─── 페이지 진입 시 모든 상태 초기화 (F5 / HMR 어느 쪽이든) ────
  // F5: 메모리 비워 어차피 초기값이지만, 방어적 명시.
  // HMR: zustand 상태가 module reload 후에도 유지되는데, 이걸 끊음.
  useEffect(() => {
    useSolarSystemStore.getState().reset()
  }, [])

  // ─── 키보드 단축키 (시간만 — 모드 단축키는 sub-2-5/6) ─────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const store = useSolarSystemStore.getState()

      if (e.code === 'Space') {
        e.preventDefault()
        store.togglePause()
      } else if (e.key === 'r' || e.key === 'R') {
        store.reset()
      } else if (e.key === '1') {
        store.setTimeSpeed(0.1)
      } else if (e.key === '2') {
        store.setTimeSpeed(1)
      } else if (e.key === '3') {
        store.setTimeSpeed(100)
      } else if (e.key === '4') {
        store.setTimeSpeed(10_000)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-2xl backdrop-blur-md">
        {/* ── 정지 / 재생 ── Space ── */}
        <button
          type="button"
          onClick={togglePause}
          aria-label={isPaused ? '재생 (Space)' : '정지 (Space)'}
          aria-pressed={isPaused}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition ${
            isPaused
              ? 'bg-white/20 text-white'
              : 'text-white/80 hover:bg-white/10'
          }`}
        >
          {isPaused ? '▶' : '⏸'}
        </button>

        <div className="h-6 w-px bg-white/10" aria-hidden />

        {/* ── 속도 선택 ── 1/2/3/4 ── 정지 중 클릭 시 자동 재생 ── */}
        <div role="group" aria-label="시간 속도" className="flex gap-1">
          {availableSpeeds.map((speed, idx) => {
            const isActive = currentSpeed === speed
            return (
              <button
                key={speed}
                type="button"
                onClick={() => setTimeSpeed(speed)}
                aria-label={`속도 ${formatSpeed(speed)} (${idx + 1})`}
                aria-pressed={isActive}
                className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {formatSpeed(speed)}
              </button>
            )
          })}
        </div>

        <div className="h-6 w-px bg-white/10" aria-hidden />

        {/* ── 진실 토글 (Light 8 + 9) ────────────────── */}
        <div
          role="group"
          aria-label="진실 토글"
          className="flex gap-1"
        >
          <button
            type="button"
            onClick={toggleScaleMode}
            aria-label={
              isScaleReal
                ? '거리 시각 모드로 (현재 진실)'
                : '거리 진실 모드로 (현재 시각)'
            }
            aria-pressed={isScaleReal}
            className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
              isScaleReal
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            거리
          </button>

          <button
            type="button"
            onClick={toggleRotationMode}
            aria-label={
              isRotationReal
                ? '자전 시각 모드로 (현재 진실)'
                : '자전 진실 모드로 (현재 시각)'
            }
            aria-pressed={isRotationReal}
            className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
              isRotationReal
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            자전
          </button>

          <button
            type="button"
            onClick={toggleAllTruth}
            aria-label={
              isAllTruth
                ? '전체 시각 모드로 (현재 둘 다 진실)'
                : '전체 진실 모드 (거리 + 자전 동시)'
            }
            aria-pressed={isAllTruth}
            className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
              isAllTruth
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            전체 진실
          </button>
        </div>

        <div className="h-6 w-px bg-white/10" aria-hidden />

        {/* ── 리셋 ── R ── 시간 + 모드 전부 처음으로 (카메라는 sub-2-5) ── */}
        <button
          type="button"
          onClick={reset}
          aria-label="전체 리셋 (R)"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg text-white/80 transition hover:bg-white/10"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
