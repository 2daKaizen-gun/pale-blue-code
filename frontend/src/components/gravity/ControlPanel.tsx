import { useEffect, useState } from 'react'
import { useGravityStore, TIME_SPEEDS, type IntegratorKind } from '../../store/gravityStore'
import { EnergyReadout } from './EnergyReadout'
import type { SystemState } from '../../lib/physics/types'
import type { PresetBody, PresetId } from '../../data/presets'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * ControlPanel — Canvas 밖, 화면 *하단* 고정 (상단은 PresetSelector 몫).
 *
 * 자라나는 패널 — 클러스터가 가로로 합류:
 *   - 3-5 Light 2 : [Euler | RK4] 적분기 토글 (store)
 *   - 3-5 Light 5 : 에너지/각운동량 readout (physics ref 샘플)
 *   - 3-5 Light 7 : 카오스 섭동 슬라이더 (three-body 한정)
 *   - 3-6        : 시간 속도 + paused (재생 컨트롤 — 맨 앞 고정) + 키보드
 *   - 3-7        : ↻ 리로드 + R 키, Follow 순환 버튼, 모바일 줄바꿈 레이아웃
 *
 * 레이아웃 (sub-3-7): PresetSelector 와 동일하게 `absolute` (부모 = 콘텐츠
 * 영역) 라 데스크톱 사이드바 위로 안 넘침. 패널이 [↻ ⏸ 속도 | 적분기 |
 * readout | Follow | nudge] 로 길어져 (3-6 "비대화" 후보) 좁은 폰의 가로
 * 스크롤이 불편 → 모바일은 `flex-wrap` 으로 여러 줄 + 중앙 정렬, 데스크톱
 * (md+)은 한 줄 nowrap + 가로 스크롤 폴백. 구분선은 모바일에서 숨김(줄바꿈
 * 되면 어색) → gap 으로 구분, md+ 에서만 표시.
 *
 * 스타일은 PresetSelector / 기존 토글 미러. 접근성 (PRD §6): 네이티브 컨트롤,
 * 활성 적분기·속도·추적 `aria-pressed`, 재생/정지·리로드 `aria-label`, 슬라이더
 * `aria-label` + 키보드 조작, readout 수치 병기. 속도 라벨은 *색에만* 의존하지
 * 않게 텍스트(×) 병기.
 *
 * 시간 컨트롤을 *맨 앞* 에 두는 이유: 재생 컨트롤이 선두가 관습적이고, 섭동
 * 슬라이더는 three-body 에서만 나타나므로 — 시간 컨트롤이 그 뒤였다면 프리셋
 * 전환마다 위치가 흔들린다. 맨 앞 = 위치 고정. ↻ 리로드도 이 선두 클러스터에.
 * Follow 버튼은 항상 보이므로 조건부 nudge *앞* 에 둬 위치를 안정시킨다.
 *
 * 키보드 (3-6/3-7): Space = 일시정지, 1~4 = 속도, R = 리로드(현재 프리셋
 * 재선택 = 깨끗한 재시드). 입력/버튼 포커스 시엔 무시해 네이티브 동작과 이중
 * 발화하지 않게 한다.
 *
 * 리로드 (3-7): ↻ 버튼·R 키 모두 `selectPreset(현재 presetId)` 를 재사용한다 —
 * 별도 reset 액션을 만들지 않는다 (sub-2-4/sub-3-6 YAGNI). store 의 nonce
 * (presetLoadedAt) 가 같은 id 에도 bump 되므로, 재선택이 곧 리셋이 된다.
 *
 * 추적 (3-7): Follow 버튼은 followIndex 를 순환한다 — Free → body 0 → 1 → …
 * → Free. 카메라가 그 천체를 따라가는 *기준계 전환* (Scene 의 CameraController).
 *
 * 설계 노트 — 섭동 슬라이더는 *놓을 때*(onPointerUp/onKeyUp) 만 store 에
 * 커밋한다. 드래그 내내 커밋하면 재시드(+trail remount)가 매 틱 일어나 GPU 를
 * thrash — 3-4 컨텍스트 손실의 그 패턴. draft 로 화면만 따라가고, 손을 떼는
 * 순간 한 번 운명을 새로 굴린다.
 */

const INTEGRATORS: { kind: IntegratorKind; label: string; hint: string }[] = [
  {
    kind: 'euler',
    label: 'Euler',
    hint: '단순한 1차 방식: 에너지가 새어 궤도가 풀립니다',
  },
  {
    kind: 'rk4',
    label: 'RK4',
    hint: '4차 룽게-쿠타 방식: 궤도가 닫힌 채 유지됩니다',
  },
]

/** 0.1 → "0.1×", 10000 → "10,000×". Speed is a *visual* multiplier, never dt. */
const formatSpeed = (speed: number) => `${speed.toLocaleString('en-US')}×`

interface ControlPanelProps {
  bodiesRef: React.RefObject<SystemState>
  /** Render metadata, index-aligned with bodiesRef — for the Follow label. */
  presetBodies: PresetBody[]
  G: number
  softening: number
  presetId: PresetId
}

export function ControlPanel({
  bodiesRef,
  presetBodies,
  G,
  softening,
  presetId,
}: ControlPanelProps) {
  const integrator = useGravityStore((s) => s.integrator)
  const setIntegrator = useGravityStore((s) => s.setIntegrator)
  const perturbation = useGravityStore((s) => s.perturbation)
  const setPerturbation = useGravityStore((s) => s.setPerturbation)
  const timeSpeed = useGravityStore((s) => s.timeSpeed)
  const paused = useGravityStore((s) => s.paused)
  const setTimeSpeed = useGravityStore((s) => s.setTimeSpeed)
  const togglePause = useGravityStore((s) => s.togglePause)
  const selectPreset = useGravityStore((s) => s.selectPreset)
  const followIndex = useGravityStore((s) => s.followIndex)
  const setFollowIndex = useGravityStore((s) => s.setFollowIndex)

  // Slider follows the finger continuously (draft); commits to the store —
  // which re-seeds the simulation — only on release. Keep draft in sync when
  // perturbation changes elsewhere (e.g. reset to 0 on a preset switch).
  const [draft, setDraft] = useState(perturbation)
  useEffect(() => {
    setDraft(perturbation)
  }, [perturbation])

  // Keyboard controls. Space toggles pause; 1–4 pick a speed; R reloads the
  // current preset (clean re-seed via the nonce). Skip when an interactive
  // element is focused so we don't double-fire with native button/slider
  // behaviour. zustand setters are stable refs; presetId is read fresh via
  // getState() so the handler needn't re-bind on preset change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const tag = el?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        el?.isContentEditable
      ) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
        return
      }
      if (e.code === 'KeyR') {
        e.preventDefault()
        const s = useGravityStore.getState()
        s.selectPreset(s.presetId)
        return
      }
      const idx = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code)
      if (idx !== -1) {
        e.preventDefault()
        setTimeSpeed(TIME_SPEEDS[idx])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause, setTimeSpeed])

  const isThreeBody = presetId === 'three-body'

  // Cycle: Free → body 0 → 1 → … → last → Free. The camera tracks the chosen
  // body (Scene's CameraController); Free = no tracking (orbit the origin).
  const cycleFollow = () => {
    const n = presetBodies.length
    const next =
      followIndex == null ? 0 : followIndex + 1 >= n ? null : followIndex + 1
    setFollowIndex(next)
  }
  const followLabel =
    followIndex == null ? '자유 시점' : presetBodies[followIndex]?.label ?? '자유 시점'

  return (
    <div className="absolute bottom-4 md:bottom-6 left-1/2 z-10 -translate-x-1/2 max-w-[calc(100%-1rem)]">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 shadow-2xl backdrop-blur-md md:flex-nowrap md:justify-start md:gap-3 md:overflow-x-auto md:whitespace-nowrap">
        {/* Time controls — playback. Fixed leftmost so the conditional nudge
            slider never shifts them. Speed = how many fixed-dt steps per frame,
            never a bigger dt (PRD §4-6 / sub-3-6). ↻ reload heads the cluster. */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => selectPreset(presetId)}
            aria-label="Reload preset"
            title="Reload preset — clean re-seed (R)"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            ↻
          </button>
          <button
            type="button"
            onClick={togglePause}
            aria-pressed={paused}
            aria-label={paused ? 'Play' : 'Pause'}
            title={paused ? 'Play (Space)' : 'Pause (Space)'}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              paused
                ? 'bg-white/90 text-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {paused ? '▶' : '⏸'}
          </button>
          <div
            role="group"
            aria-label="Visual speed"
            className="flex items-center gap-1 rounded-xl bg-white/5 p-0.5"
          >
            {TIME_SPEEDS.map((speed) => {
              const active = speed === timeSpeed
              return (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setTimeSpeed(speed)}
                  aria-pressed={active}
                  title={`${formatSpeed(speed)} — visual speed (accuracy is unchanged)`}
                  className={[
                    'rounded-lg px-2.5 py-1.5 text-sm font-medium tabular-nums transition-colors',
                    active
                      ? 'bg-white/90 text-black'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  {formatSpeed(speed)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Integrator toggle — the method axis (PRD §3, the soul) */}
        <div role="group" aria-label="Integrator" className="flex items-center gap-1">
          <span className="px-1 text-xs font-medium uppercase tracking-wide text-white/40">
            Integrator
          </span>
          <div className="flex items-center gap-1 rounded-xl bg-white/5 p-0.5">
            {INTEGRATORS.map(({ kind, label, hint }) => {
              const active = kind === integrator
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setIntegrator(kind)}
                  aria-pressed={active}
                  title={hint}
                  className={[
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-white/90 text-black'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Conservation readout — the consequence of the method, made numeric */}
        <EnergyReadout
          bodiesRef={bodiesRef}
          G={G}
          softening={softening}
          presetId={presetId}
        />

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Camera follow — reference-frame change. Cycles Free → each body.
            Always present; kept before the conditional nudge so its position
            is stable across presets. */}
        <button
          type="button"
          onClick={cycleFollow}
          aria-pressed={followIndex != null}
          title="Follow a body — the camera tracks it (click to cycle)"
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            followIndex != null
              ? 'bg-white/90 text-black'
              : 'text-white/70 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          추적: {followLabel}
        </button>

        {/* Chaos perturbation — the condition axis. Only the figure-8 is
            sensitive enough to make "a hair's nudge splits the fate" land.
            Kept last so its show/hide never shifts the controls before it. */}
        {isThreeBody && (
          <>
            <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <label
                htmlFor="perturbation"
                className="text-xs font-medium uppercase tracking-wide text-white/40"
              >
                Nudge
              </label>
              <input
                id="perturbation"
                type="range"
                min={0}
                max={0.05}
                step={0.001}
                value={draft}
                onChange={(e) => setDraft(parseFloat(e.target.value))}
                onPointerUp={() => setPerturbation(draft)}
                onKeyUp={() => setPerturbation(draft)}
                aria-label="Three-body initial perturbation (nudge the starting point)"
                className="w-24 accent-white"
              />
              <span className="w-12 font-mono text-[11px] tabular-nums text-white/70">
                {draft.toFixed(3)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
