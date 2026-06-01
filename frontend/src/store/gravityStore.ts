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
 * and the Scene/refs (inside it). sub-3-3 ran on a single hard-coded
 * system via `useRef` + inline constants; from 3-4, a control *outside*
 * the Canvas and physics *inside* it must agree on shared values, so
 * Zustand (Phase 2 pattern) earns its place.
 *
 *   - 3-4 added `presetId` (the active preset)
 *   - 3-5 adds `integrator` (the soul toggle: 'rk4' | 'euler')
 *   - 3-6 will add `timeSpeed` (paused / 0.1× / 1× / 100× / 10,000×)
 *
 * Control values are read via `getState()` inside `useFrame` (zero
 * per-frame re-renders); UI components subscribe to them normally.
 */
interface GravityStore {
  presetId: PresetId
  integrator: IntegratorKind
  selectPreset: (id: PresetId) => void
  setIntegrator: (kind: IntegratorKind) => void
}

export const useGravityStore = create<GravityStore>((set) => ({
  presetId: DEFAULT_PRESET_ID,
  integrator: 'rk4',
  selectPreset: (id) => set({ presetId: id }),
  setIntegrator: (kind) => set({ integrator: kind }),
}))
