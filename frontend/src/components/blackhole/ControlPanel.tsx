import { useBlackholeStore, type LensingSteps } from '../../store/blackholeStore'
import { bhOrbitRef } from './refs'

const STEPS_OPTIONS: LensingSteps[] = [64, 96, 128]

export function ControlPanel() {
  const mass        = useBlackholeStore((s) => s.mass)
  const setMass     = useBlackholeStore((s) => s.setMass)
  const steps       = useBlackholeStore((s) => s.steps)
  const setSteps    = useBlackholeStore((s) => s.setSteps)
  const showHorizon = useBlackholeStore((s) => s.showHorizon)
  const setShowHorizon = useBlackholeStore((s) => s.setShowHorizon)
  const diskVisible = useBlackholeStore((s) => s.diskVisible)
  const setDiskVisible = useBlackholeStore((s) => s.setDiskVisible)

  const handleReset = () => {
    setMass(1.5)
    setSteps(64)
    setDiskVisible(true)
    setShowHorizon(true)
    bhOrbitRef.current?.reset()
  }

  return (
    <div className="absolute bottom-4 md:bottom-6 left-1/2 z-10 -translate-x-1/2 max-w-[calc(100%-1rem)]">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 shadow-2xl backdrop-blur-md md:flex-nowrap md:gap-3">

        {/* Reset — return camera + controls to initial state */}
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset view and controls"
          title="Reset camera and controls to default"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          ↻
        </button>

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Mass slider */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="bh-mass"
            className="text-xs font-medium uppercase tracking-wide text-white/40"
          >
            Mass
          </label>
          <input
            id="bh-mass"
            type="range"
            min={0.3}
            max={3.0}
            step={0.05}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            aria-label="Black hole mass (scales Schwarzschild radius)"
            className="w-28 accent-white"
          />
          <span className="w-8 font-mono text-[11px] tabular-nums text-white/70">
            {mass.toFixed(1)}
          </span>
        </div>

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Steps toggle — quality vs speed, mirrors Phase 3 integrator toggle */}
        <div role="group" aria-label="Integration steps" className="flex items-center gap-1">
          <span className="px-1 text-xs font-medium uppercase tracking-wide text-white/40">
            Steps
          </span>
          <div className="flex items-center gap-1 rounded-xl bg-white/5 p-0.5">
            {STEPS_OPTIONS.map((s) => {
              const active = s === steps
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSteps(s)}
                  aria-pressed={active}
                  title={`${s} RK4 steps per pixel — more = sharper ring, heavier GPU`}
                  className={[
                    'rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors',
                    active
                      ? 'bg-white/90 text-black'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Horizon toggle */}
        <button
          type="button"
          onClick={() => setShowHorizon(!showHorizon)}
          aria-pressed={showHorizon}
          title="Show event horizon ring overlay"
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            showHorizon
              ? 'bg-white/90 text-black'
              : 'text-white/70 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          Horizon
        </button>

        <div className="hidden md:block h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />

        {/* Disk toggle */}
        <button
          type="button"
          onClick={() => setDiskVisible(!diskVisible)}
          aria-pressed={diskVisible}
          title="Show accretion disk with Doppler beaming"
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            diskVisible
              ? 'bg-orange-400/90 text-black'
              : 'text-white/70 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          Disk
        </button>

      </div>
    </div>
  )
}
