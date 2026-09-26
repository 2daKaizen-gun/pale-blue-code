import { useLayoutEffect, useState } from 'react'
import { totalEnergy, angularMomentum } from '../../lib/physics/energy'
import type { SystemState } from '../../lib/physics/types'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * EnergyReadout — the oracle made visible. Conservation laws don't care how
 * wild an orbit *looks*; a correct integrator holds total energy and angular
 * momentum nearly flat, a broken one lets them drift. This component samples
 * the live physics and shows the *relative drift since preset load* as two
 * gauges that surge (Euler) or stay flat (RK4). PRD §3's soul, made numeric.
 *
 * Lives *inside* ControlPanel (Canvas 밖). It samples `bodiesRef.current` on
 * a throttle — its setState re-renders only this tiny subtree, never the
 * scene/Integrator (those read `getState()` + refs). Physics-in-ref intact.
 *
 * 접근성 (PRD §6): drift 는 *수치로 병기* — 색은 보조 신호일 뿐, 숫자가 정본.
 */

interface EnergyReadoutProps {
  bodiesRef: React.RefObject<SystemState>
  /** Gravitational constant — must match the preset that drives the physics. */
  G: number
  /**
   * Softening ε of the active preset. *Required*: the PE in `totalEnergy` must
   * use the SAME ε as the force, or even RK4 shows a spurious drift at ε>0
   * (energy.ts warns about this directly).
   */
  softening: number
}

/**
 * Sample rate. Physics steps every frame (in a ref); the readout peeks at a
 * calm ~6 Hz — fast enough to *watch* a bar climb, slow enough that its
 * re-render is free. (sub-3-4 allowed "throttled setState OR ref→DOM"; this is
 * the simpler of the two and plenty.)
 */
const SAMPLE_MS = 160

/**
 * The bar fills at 1% relative drift. RK4 sits far below this (bar flat);
 * Euler blows past within a few orbits (bar pegs full). PRD §5 targets — RK4
 * energy < 0.1%, L < 0.01% — both rest near the floor of this scale.
 */
const FULL_SCALE = 0.01

function fmtPct(x: number): string {
  if (!isFinite(x)) return '—'
  const p = x * 100
  if (p < 0.001) return '0.000%'
  if (p < 1) return p.toFixed(3) + '%'
  if (p < 100) return p.toFixed(1) + '%'
  return Math.round(p).toLocaleString() + '%'
}

// Color is a *secondary* cue (numbers are the source of truth, PRD §6): calm
// when conserved, warming as the universe leaks.
function barColor(fill: number): string {
  if (fill < 0.3) return 'bg-emerald-400/80'
  if (fill < 0.7) return 'bg-amber-400/80'
  return 'bg-rose-500/90'
}

function Gauge({ label, pct, fill }: { label: string; pct: string; fill: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-9 w-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-150 ${barColor(fill)}`}
          style={{ height: `${fill * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-[10px] font-medium text-white/50">{label}</span>
      <span className="font-mono text-[11px] tabular-nums text-white/80">{pct}</span>
    </div>
  )
}

export function EnergyReadout({ bodiesRef, G, softening }: EnergyReadoutProps) {
  const [eDrift, setEDrift] = useState(0)
  const [lDrift, setLDrift] = useState(0)

  // Baselines captured when a simulation generation starts, *before* any
  // integration: GravityPage hands down a fresh bodiesRef on every re-seed
  // (preset, perturbation, reload), and a layout effect runs after commit but
  // before the next animation frame can step the Integrator.
  useLayoutEffect(() => {
    const s0 = bodiesRef.current
    const e0 = totalEnergy(s0, G, softening)
    const l0 = angularMomentum(s0).length()
    const id = setInterval(() => {
      const s = bodiesRef.current
      const e = totalEnergy(s, G, softening)
      const l = angularMomentum(s).length()
      // Relative drift. Guard tiny baselines: a bound system has E₀ < 0, but
      // figure-8 has total L ≈ 0 (symmetry) → relative L drift is undefined.
      setEDrift(Math.abs(e0) > 1e-12 ? Math.abs(e - e0) / Math.abs(e0) : 0)
      setLDrift(l0 > 1e-9 ? Math.abs(l - l0) / l0 : NaN)
    }, SAMPLE_MS)
    return () => clearInterval(id)
  }, [bodiesRef, G, softening])

  const eFill = Math.min(1, Math.max(0, eDrift / FULL_SCALE))
  const lFill = isFinite(lDrift) ? Math.min(1, Math.max(0, lDrift / FULL_SCALE)) : 0

  return (
    <div
      role="group"
      aria-label="프리셋 로드 이후 보존량 오차 (에너지·각운동량)"
      className="flex items-center gap-3"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-white/40">
        보존량
      </span>
      <div className="flex items-end gap-3">
        <Gauge label="ΔE" pct={fmtPct(eDrift)} fill={eFill} />
        <Gauge label="ΔL" pct={fmtPct(lDrift)} fill={lFill} />
      </div>
    </div>
  )
}
