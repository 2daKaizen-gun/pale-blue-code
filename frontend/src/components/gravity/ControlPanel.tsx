import { useGravityStore, type IntegratorKind } from '../../store/gravityStore'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * ControlPanel — Canvas 밖, 화면 *하단* 고정 (상단은 PresetSelector 몫 →
 * 충돌 방지, PresetSelector 주석이 약속한 자리).
 *
 * 3-5 에 신설. 자라나는 패널 — 클러스터를 가로로 담고, 후속 sub-phase 가
 * 옆에 합류한다:
 *   - 3-5 Light 2 : [Euler | RK4] 적분기 토글  ← 지금
 *   - 3-5 Light 5 : 에너지/각운동량 readout (오른쪽 클러스터)
 *   - 3-5 Light 7 : 카오스 섭동 슬라이더 (three-body 한정)
 *   - 3-6        : 시간 속도 / paused
 *
 * 스타일은 PresetSelector 미러 (rounded-2xl / border-white/10 / bg-black/40 /
 * backdrop-blur). 접근성 (PRD §6): 네이티브 <button>, 활성 적분기 `aria-pressed`,
 * tab + Enter/Space 조작.
 *
 * 설계 노트 — Euler 버튼에 경고색을 *의도적으로 안 넣음*. PRD §3 영혼은 처음
 * 본 사람이 "어, 깨졌다" 하고 *발견* 하는 1초. 버튼이 위험을 예고하면 그 충격이
 * 죽는다. 드라마는 화면(나선 발산)과 readout 막대(Light 5)가 진다.
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

export function ControlPanel() {
  const integrator = useGravityStore((s) => s.integrator)
  const setIntegrator = useGravityStore((s) => s.setIntegrator)

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

        {/* 3-5 Light 5: <EnergyReadout /> joins here (right cluster) */}
        {/* 3-5 Light 7: chaos perturbation slider (three-body only) */}
        {/* 3-6: time-speed / paused controls */}
      </div>
    </div>
  )
}
