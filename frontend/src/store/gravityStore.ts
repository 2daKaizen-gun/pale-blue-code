import { create } from 'zustand'
import { DEFAULT_PRESET_ID, type PresetId } from '../data/presets'

/**
 * Which numerical integrator marches the physics forward.
 *   'rk4'   — the accurate 4th-order core (default: the universe stays closed).
 *   'euler' — the naive 1st-order demo (energy leaks → the universe breaks).
 * Phase 3's soul (PRD §3) lives in toggling between these two on a stable
 * orbit: same law, same dt, different *method*, different fate.
 *
 * Owned here (control state = "user intent", TechSpec §1) rather than in
 * lib/physics — so the verified integrator core (sub-3-2) is never re-touched.
 */
export type IntegratorKind = 'euler' | 'rk4'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * gravityStore — the shared truth between controls (outside the Canvas)
 * and the Scene/refs (inside it).
 *
 *   - 3-4 added `presetId` (the active preset)
 *   - 3-5 adds `integrator` (the soul toggle) + `perturbation` (chaos seed)
 *   - 3-6 will add `timeSpeed` (paused / 0.1× / 1× / 100× / 10,000×)
 *
 * Control values are read via `getState()` inside `useFrame` (zero per-frame
 * re-renders); UI components subscribe to them normally.
 *
 * `perturbation` — a fixed-direction nudge to the three-body figure-8's
 * starting point (other presets ignore it). Deterministic: the same value
 * yields the same divergence; 0 leaves the published IC untouched. Reset to
 * 0 on every preset switch so each system starts from a clean slate.
 */
interface GravityStore {
  presetId: PresetId
  integrator: IntegratorKind
  perturbation: number
  selectPreset: (id: PresetId) => void
  setIntegrator: (kind: IntegratorKind) => void
  setPerturbation: (amount: number) => void
}

export const useGravityStore = create<GravityStore>((set) => ({
  presetId: DEFAULT_PRESET_ID,
  integrator: 'rk4',
  perturbation: 0,
  selectPreset: (id) => set({ presetId: id, perturbation: 0 }),
  setIntegrator: (kind) => set({ integrator: kind }),
  setPerturbation: (amount) => set({ perturbation: amount }),
}))
