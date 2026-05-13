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
 *   *같은 store 를 읽지만 책임 완전히 분리*. sub-2-2 회고의 교훈.
 *
 * ─── sub-phase 2-3 안에서의 위치 ────────────────────
 *   [Light 4] 시각적 셸 + 강조 분기
 *   [Light 5] 정지/재생 wire-up
 *   [Light 6] ★현재★ — 속도 선택 wire-up
 *   [Light 7] — 리셋 + 모바일 속도 제한 + 키보드 단축키
 *
 * ─── 속도 클릭 시맨틱 ───────────────────────────────
 *   정지 중에 속도 버튼 클릭 → *자동 재생* (Spotify/Apple Music 패턴).
 *   *명시적 액션 = 적극적 의도* 가정. 사용자가 100× 누르면 100× 로 가고 싶은 거.
 *   store 의 setTimeSpeed 가 이미 그렇게 작동 (prevSpeed 도 같이 갱신).
 *
 * ─── sub-2-4 예고 ──────────────────────────────────
 *   자전 토글 + 거리 토글 + 전체 진실 프리셋 버튼이 이 패널에 추가됨.
 *
 * ─── 디자인 토큰 ───────────────────────────────────
 *   Phase 1 토큰 정식 적용은 sub-2-6 UI 마무리.
 *   현재는 *공통 다크 우주 테마* 로 빠르게: bg-black/40 + backdrop-blur.
 */

/**
 * 속도 표기: 1×, 100×, 10,000×, 100,000×.
 * toLocaleString 으로 천 단위 콤마 — 정확함 우선.
 */
function formatSpeed(speed: SpeedOption): string {
  return `${speed.toLocaleString('en-US')}×`
}

export function ControlPanel() {
  // store 구독 — timeSpeed 변하면 강조 버튼이 자동 바뀜.
  // Canvas 밖이라 매 프레임 리렌더 걱정 없음 (속도 변경은 사용자 액션 시점만).
  const currentSpeed = useSolarSystemStore((s) => s.timeSpeed)
  const togglePause = useSolarSystemStore((s) => s.togglePause)
  const setTimeSpeed = useSolarSystemStore((s) => s.setTimeSpeed)
  const isPaused = currentSpeed === 0

  return (
    <div className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-2xl backdrop-blur-md">
        {/* ── 정지 / 재생 — 비디오 플레이어 시맨틱 (멈춘 자리 + 속도 복원) ── */}
        <button
          type="button"
          onClick={togglePause}
          aria-label={isPaused ? '재생' : '정지'}
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

        {/* ── 속도 선택 — 정지 중 클릭 시 자동 재생 ── */}
        <div role="group" aria-label="시간 속도" className="flex gap-1">
          {SPEED_OPTIONS.map((speed) => {
            const isActive = currentSpeed === speed
            return (
              <button
                key={speed}
                type="button"
                onClick={() => setTimeSpeed(speed)}
                aria-label={`속도 ${formatSpeed(speed)}`}
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

        {/* ── 리셋 ── [Light 7] 에서 wire-up ── */}
        <button
          type="button"
          aria-label="시간 리셋"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg text-white/80 transition hover:bg-white/10"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
