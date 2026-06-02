import { useEffect, useState } from 'react'
import { useGravityStore, type IntegratorKind } from '../../store/gravityStore'
import { EnergyReadout } from './EnergyReadout'
import type { SystemState } from '../../lib/physics/types'
import type { PresetId } from '../../data/presets'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * ControlPanel — Canvas 밖, 화면 *하단* 고정 (상단은 PresetSelector 몫).
 *
 * 자라나는 패널 — 클러스터가 가로로 합류:
 *   - 3-5 Light 2 : [Euler | RK4] 적분기 토글 (store)
 *   - 3-5 Light 5 : 에너지/각운동량 readout (physics ref 샘플)
 *   - 3-5 Light 7 : 카오스 섭동 슬라이더 (three-body 한정)  ← 합류함
 *   - 3-6        : 시간 속도 / paused
 *
 * 스타일은 PresetSelector 미러. 접근성 (PRD §6): 네이티브 컨트롤, 활성 적분기
 * `aria-pressed`, 슬라이더 `aria-label` + 키보드 조작, readout 수치 병기.
 *
 * 설계 노트 — 섭동 슬라이더는 *놓을 때*(onPointerUp/onKeyUp) 만 store 에
 * 커밋한다. 드래그 내내 커밋하면 재시드(+미래의 trail remount)가 매 틱 일어나
 * GPU 를 thrash — 3-4 컨텍스트 손실의 그 패턴. draft 로 화면만 따라가고, 손을
 * 떼는 순간 한 번 운명을 새로 굴린다.
 */

const INTEGRATORS: { kind: IntegratorKind; label: string; hint: string }[] = [
  {
    kind: 'euler',
    label: 'Euler',
    hint: 'Naive 1st-order: energy leaks, the orbit unwinds',
  },
  {
    kind: 'rk4',
    label: 'RK4',
    hint: '4th-order Runge–Kutta: the orbit stays closed',
  },
]

interface ControlPanelProps {
  bodiesRef: React.RefObject<SystemState>
  G: number
  softening: number
  presetId: PresetId
}

export function ControlPanel({ bodiesRef, G, softening, presetId }: ControlPanelProps) {
  const integrator = useGravityStore((s) => s.integrator)
  const setIntegrator = useGravityStore((s) => s.setIntegrator)
  const perturbation = useGravityStore((s) => s.perturbation)
  const setPerturbation = useGravityStore((s) => s.setPerturbation)

  // Slider follows the finger continuously (draft); commits to the store —
  // which re-seeds the simulation — only on release. Keep draft in sync when
  // perturbation changes elsewhere (e.g. reset to 0 on a preset switch).
  const [draft, setDraft] = useState(perturbation)
  useEffect(() => {
    setDraft(perturbation)
  }, [perturbation])

  const isThreeBody = presetId === 'three-body'

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 z-10 -translate-x-1/2 max-w-[calc(100vw-1rem)]">
      <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap rounded-2xl border border-white/10 bg-black/40 px-3 py-2 shadow-2xl backdrop-blur-md">
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

        <div className="h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Conservation readout — the consequence of the method, made numeric */}
        <EnergyReadout
          bodiesRef={bodiesRef}
          G={G}
          softening={softening}
          presetId={presetId}
        />

        {/* Chaos perturbation — the condition axis. Only the figure-8 is
            sensitive enough to make "a hair's nudge splits the fate" land. */}
        {isThreeBody && (
          <>
            <div className="h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />
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

        {/* 3-6: time-speed / paused controls */}
      </div>
    </div>
  )
}
