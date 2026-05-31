import { create } from 'zustand'
import { DEFAULT_PRESET_ID, type PresetId } from '../data/presets'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * gravityStore — the shared truth between the PresetSelector (outside the
 * Canvas) and the Scene/refs (inside it). sub-3-3 ran on a single
 * hard-coded system via `useRef` + inline constants; this is the first
 * point where a control *outside* the Canvas and physics *inside* it must
 * agree on one value, so Zustand (Phase 2 pattern) earns its place.
 *
 * Deliberately minimal for 3-4 — just the active preset:
 *   - 3-5 adds `integrator: 'rk4' | 'euler'` (the soul toggle)
 *   - 3-6 adds `timeSpeed` (paused / 0.1× / 1× / 100× / 10,000×)
 * Both will be read via `getState()` inside `useFrame` (zero per-frame
 * re-renders), exactly like solarSystemStore.
 */
interface GravityStore {
  presetId: PresetId
  selectPreset: (id: PresetId) => void
}

export const useGravityStore = create<GravityStore>((set) => ({
  presetId: DEFAULT_PRESET_ID,
  selectPreset: (id) => set({ presetId: id }),
}))
