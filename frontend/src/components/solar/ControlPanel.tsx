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
 * ─── leva 와의 분리 ─────────────────────────────────
 *   leva 'Time (dev)' 패널 = 개발자 도구. 비표준 값 + 빠른 튜닝.
 *   ControlPanel = 사용자 도구. 정해진 속도 + 명확한 UX.
 *
 * ─── sub-phase 2-3 안에서의 위치 ────────────────────
 *   [Light 4] 시각적 셸 + 강조 분기
 *   [Light 5] 정지/재생 wire-up
 *   [Light 6] 속도 선택 wire-up
 *   [Light 7] ★현재★ — 리셋 + 모바일 속도 제한 + 키보드 단축키
 *
 * ─── 키보드 단축키 ─────────────────────────────────
 *   Space: 정지/재생 (비디오 플레이어 표준)
 *   1/2/3/4: 속도 직접 선택 (1×, 100×, 10,000×, 100,000×)
 *   R: 리셋
 *   *<input>/<textarea> 포커스 중에는 무시* — 정상 입력 보호
 *
 * ─── 모바일 속도 제한 ──────────────────────────────
 *   (pointer: coarse) = 터치 디바이스. 100,000× *숨김*.
 *   PRD §6: 배터리 보호. *한 단계 낮춤*.
 *
 * ─── 리셋의 책임 범위 ──────────────────────────────
 *   *시간만* 리셋. 카메라 리셋은 sub-2-5 별도 버튼.
 */

const MOBILE_MAX_SPEED = 10_000
const COARSE_POINTER_QUERY = '(pointer: coarse)'

/**
 * 속도 표기: 1×, 100×, 10,000×, 100,000×.
 * toLocaleString 으로 천 단위 콤마 — 정확함 우선.
 */
function formatSpeed(speed: SpeedOption): string {
  return `${speed.toLocaleString('en-US')}×`
}

// ─── useSyncExternalStore 패턴: 외부 source (matchMedia) 와 정확 동기화 ──
//
// useEffect + setState 패턴은 React 19 에서 *cascading render 안티패턴* 으로 경고됨.
// useSyncExternalStore 는 외부 source 와 *tear 없이* 동기화하는 공식 hook.
//
// Zustand 가 내부적으로 이 hook 을 사용 — 즉 우리는 매번 *간접적으로* 써왔음.
// 직접 사용하면 *외부 reactive source 와 React 의 연결고리* 가 보임.
//
//   subscribe   : source 변경 시 React 에게 알리는 방법 (callback 등록 + cleanup 반환)
//   getSnapshot : 현재 source 의 *순간 값* (매번 동일 입력 → 동일 출력)
//   getServerSnapshot : SSR 시 사용할 *서버 측 스냅샷* (Vite SPA 라 사실상 무관)

function subscribeCoarsePointer(callback: () => void): () => void {
  const mq = window.matchMedia(COARSE_POINTER_QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getCoarsePointerSnapshot(): boolean {
  return window.matchMedia(COARSE_POINTER_QUERY).matches
}

function getCoarsePointerServerSnapshot(): boolean {
  return false // SSR 환경에선 데스크톱 가정 (안전한 default)
}

/**
 * 터치 디바이스 (pointer: coarse) 여부.
 * SSR 안전, cascading render 0, 디바이스 회전/외장 마우스 연결 자동 추적.
 */
function useIsTouchDevice(): boolean {
  return useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  )
}

export function ControlPanel() {
  // store 구독 — timeSpeed 변하면 강조 버튼이 자동 바뀜.
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
  // getState 직접 호출 → dependency 0, ESLint 안전, effect 한 번만 set up.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 입력 필드 포커스 중에는 단축키 무시 — 정상 텍스트 입력 보호
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
        e.preventDefault() // 페이지 스크롤 방지
        store.togglePause()
      } else if (e.key === 'r' || e.key === 'R') {
        store.reset()
      } else if (e.key === '1') {
        store.setTimeSpeed(1)
      } else if (e.key === '2') {
        store.setTimeSpeed(100)
      } else if (e.key === '3') {
        store.setTimeSpeed(10_000)
      } else if (e.key === '4') {
        store.setTimeSpeed(100_000)
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
