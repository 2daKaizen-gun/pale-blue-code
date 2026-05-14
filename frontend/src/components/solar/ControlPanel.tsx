import { useEffect, useSyncExternalStore } from 'react'
import {
  useSolarSystemStore,
  SPEED_OPTIONS,
  type SpeedOption,
} from '../../store/solarSystemStore'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * ControlPanel — 사용자가 시간을 조작하는 도구. Canvas 밖, 화면 하단 고정.
 *
 * ─── 키보드 단축키 ─────────────────────────────────
 *   Space: 정지/재생
 *   1/2/3/4: 0.1× / 1× / 100× / 10,000×
 *   R: 리셋
 *   *<input>/<textarea> 포커스 중에는 무시*
 *
 * ─── 모바일 속도 제한 ──────────────────────────────
 *   현재 SPEED_OPTIONS 최대값이 10,000× 라 실효 제한 없음.
 *   인프라는 sub-2-7 모바일 최적화 / 향후 더 빠른 속도 추가 위해 유지.
 *
 * ─── 리셋의 책임 범위 ──────────────────────────────
 *   *시간만* 리셋. 카메라 리셋은 sub-2-5 별도 버튼.
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
  const currentSpeed = useSolarSystemStore((s) => s.timeSpeed)
  const togglePause = useSolarSystemStore((s) => s.togglePause)
  const setTimeSpeed = useSolarSystemStore((s) => s.setTimeSpeed)
  const reset = useSolarSystemStore((s) => s.reset)
  const isPaused = currentSpeed === 0

  const isTouch = useIsTouchDevice()
  const availableSpeeds: readonly SpeedOption[] = isTouch
    ? SPEED_OPTIONS.filter((s) => s <= MOBILE_MAX_SPEED)
    : SPEED_OPTIONS

  // ─── 키보드 단축키 ─────────────────────────────────
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

        {/* ── 리셋 ── R ── 시간만 (카메라는 sub-2-5 별도) ── */}
        <button
          type="button"
          onClick={reset}
          aria-label="시간 리셋 (R)"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg text-white/80 transition hover:bg-white/10"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
