import { useEffect } from 'react'
import {
  useSolarSystemStore,
  SPEED_OPTIONS,
  type SpeedOption,
} from '../../store/solarSystemStore'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'
import { ToggleButton, IconButton } from './ControlButtons'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * ControlPanel — 사용자가 시간 + 진실 모드 + 카메라를 조작하는 도구. Canvas 밖, 화면 하단 고정.
 *
 * ─── 레이아웃 ────────────────────────────────────
 *   [정지] | [속도 4개] | [거리] [자전] [전체 진실] | [↺] [🎥]
 *      시간 그룹                    진실 토글 그룹      리셋 그룹
 *
 * ─── 키보드 단축키 ─────────────────────────────────
 *   Space: 정지/재생   1/2/3/4: 0.1× / 1× / 100× / 10,000×   R: 통합 리셋
 *   D/T/A: 거리 / 자전 / 전체 진실 토글.  C: 카메라 리셋.
 *   *<input>/<textarea> 포커스 중에는 무시*
 *
 * ─── 버튼 컴포넌트 (sub-2-6 L9) ────────────────────
 *   반복되던 버튼 스타일을 ToggleButton / IconButton 으로 추출 (ControlButtons.tsx).
 *
 * ─── sub-phase 2-7 [L1] 변경 ───────────────────────
 *   인라인 useIsTouchDevice + matchMedia 함수들을 hooks/useIsTouchDevice 로 추출.
 *   여기선 import 해서 속도 상한에만 사용. 동일 판정을 Scene/Planet/Starfield 도 공유(L4).
 *
 * ─── sub-phase 2-7 [L8] 변경 (모바일 반응형) ──────────
 *   버튼 10개가 좁은 폰 폭을 넘쳐 라벨이 글자 단위로 깨지던 문제.
 *   max-w(뷰포트-1rem) + overflow-x-auto + whitespace-nowrap → 좁으면 가로 스크롤,
 *   라벨은 항상 한 줄 유지. bottom 도 모바일에선 살짝 내려 썸 영역에 맞춤.
 */

const MOBILE_MAX_SPEED = 10_000

function formatSpeed(speed: SpeedOption): string {
  return `${speed.toLocaleString('en-US')}×`
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

  // ── 카메라 리셋 (sub-2-5 [Light 7]) ──────────────
  const resetCameraView = useSolarSystemStore((s) => s.resetCameraView)

  const isTouch = useIsTouchDevice()
  const availableSpeeds: readonly SpeedOption[] = isTouch
    ? SPEED_OPTIONS.filter((s) => s <= MOBILE_MAX_SPEED)
    : SPEED_OPTIONS

  // ─── 페이지 진입 시 모든 상태 초기화 (F5 / HMR 어느 쪽이든) ────
  useEffect(() => {
    useSolarSystemStore.getState().reset()
  }, [])

  // ─── 키보드 단축키 ───────────────────────────────
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
      } else if (e.key === 'd' || e.key === 'D') {
        store.toggleScaleMode()
      } else if (e.key === 't' || e.key === 'T') {
        store.toggleRotationMode()
      } else if (e.key === 'a' || e.key === 'A') {
        store.toggleAllTruth()
      } else if (e.key === 'c' || e.key === 'C') {
        store.resetCameraView()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 z-10 -translate-x-1/2 max-w-[calc(100vw-1rem)]">
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-2xl backdrop-blur-md">
        {/* 정지 / 재생 (Space) */}
        <IconButton
          icon={isPaused ? '▶' : '⏸'}
          onClick={togglePause}
          ariaLabel={isPaused ? '재생 (Space)' : '정지 (Space)'}
          active={isPaused}
        />

        <div className="h-6 w-px bg-white/10" aria-hidden />

        {/* 속도 1/2/3/4 */}
        <div role="group" aria-label="시간 속도" className="flex gap-1">
          {availableSpeeds.map((speed, idx) => (
            <ToggleButton
              key={speed}
              label={formatSpeed(speed)}
              active={currentSpeed === speed}
              onClick={() => setTimeSpeed(speed)}
              ariaLabel={`속도 ${formatSpeed(speed)} (${idx + 1})`}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-white/10" aria-hidden />

        {/* 진실 토글 D / T / A */}
        <div role="group" aria-label="진실 토글" className="flex gap-1">
          <ToggleButton
            label="거리"
            active={isScaleReal}
            onClick={toggleScaleMode}
            ariaLabel={`${
              isScaleReal ? '거리 시각 모드로 (현재 진실)' : '거리 진실 모드로 (현재 시각)'
            } (단축키 D)`}
          />
          <ToggleButton
            label="자전"
            active={isRotationReal}
            onClick={toggleRotationMode}
            ariaLabel={`${
              isRotationReal ? '자전 시각 모드로 (현재 진실)' : '자전 진실 모드로 (현재 시각)'
            } (단축키 T)`}
          />
          <ToggleButton
            label="전체 진실"
            active={isAllTruth}
            onClick={toggleAllTruth}
            ariaLabel={`${
              isAllTruth ? '전체 시각 모드로 (현재 둘 다 진실)' : '전체 진실 모드 (거리 + 자전 동시)'
            } (단축키 A)`}
          />
        </div>

        <div className="h-6 w-px bg-white/10" aria-hidden />

        {/* 리셋 — 통합(↺) + 카메라만(🎥) */}
        <div role="group" aria-label="리셋" className="flex gap-1">
          <IconButton
            icon="↺"
            onClick={reset}
            ariaLabel="전체 리셋 (R) — 시간 + 모드 + 카메라"
          />
          <IconButton
            icon="🎥"
            size="base"
            onClick={resetCameraView}
            ariaLabel="카메라 리셋 (C) — 자유 카메라로 복귀"
          />
        </div>
      </div>
    </div>
  )
}
