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
 * Visual time speeds (sub-3-6). A multiplier on *sim-time per real-second* —
 * NOT on dt. The integrator keeps each preset's fixed `recommendedDt`; speed
 * only changes how much sim-time a frame is asked to cover, which the
 * Integrator's accumulator turns into a whole number of fixed-dt substeps
 * (faster = more steps per frame; 0.1× = roughly one step every several
 * frames). Accuracy is therefore independent of speed — the whole point
 * (PRD §4 item 6 / §5).
 *
 * Mirrors Phase 2's ladder: 100,000× dropped (unreadable to the human eye),
 * 0.1× kept (slow enough to watch a single orbit breathe).
 */
export const TIME_SPEEDS = [0.1, 1, 100, 10_000] as const
export type TimeSpeed = (typeof TIME_SPEEDS)[number]
export const DEFAULT_TIME_SPEED: TimeSpeed = 1

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * gravityStore — the shared truth between controls (outside the Canvas)
 * and the Scene/refs (inside it).
 *
 *   - 3-4 added `presetId` (the active preset)
 *   - 3-5 added `integrator` (the soul toggle) + `perturbation` (chaos seed)
 *   - 3-6 adds `timeSpeed` + `paused` (visual speed, decoupled from dt)
 *
 * Control values are read via `getState()` inside `useFrame` (zero per-frame
 * re-renders); UI components subscribe to them normally.
 *
 * `timeSpeed` vs `paused` are *orthogonal*: pausing gates the substep loop
 * while leaving the selected speed intact, so un-pausing resumes at the same
 * speed (no Phase-2-style `prevSpeed` bookkeeping needed). Supersedes the
 * earlier TechSpec §3 sketch that folded pause into `timeSpeed === 0`.
 *
 * `perturbation` — a fixed-direction nudge to the three-body figure-8's
 * starting point (other presets ignore it). Deterministic: the same value
 * yields the same divergence; 0 leaves the published IC untouched.
 */
interface GravityStore {
  presetId: PresetId
  integrator: IntegratorKind
  perturbation: number
  /** Visual speed multiplier (sub-3-6). Never scales dt — see TIME_SPEEDS. */
  timeSpeed: TimeSpeed
  /** Gates the substep loop (sub-3-6). Independent of `timeSpeed`. */
  paused: boolean
  selectPreset: (id: PresetId) => void
  setIntegrator: (kind: IntegratorKind) => void
  setPerturbation: (amount: number) => void
  setTimeSpeed: (speed: TimeSpeed) => void
  togglePause: () => void
}

export const useGravityStore = create<GravityStore>((set) => ({
  presetId: DEFAULT_PRESET_ID,
  integrator: 'rk4',
  perturbation: 0,
  timeSpeed: DEFAULT_TIME_SPEED,
  paused: false,

  // Preset reselect is the Phase 3 "reset" — there is no separate reset action
  // (sub-2-4 YAGNI: one user intent = one action). It restores a clean slate:
  // clean physics IC (the ref is re-seeded by the scene layer) *and* clean
  // controls here — perturbation, speed, and pause all back to default.
  selectPreset: (id) =>
    set({
      presetId: id,
      perturbation: 0,
      timeSpeed: DEFAULT_TIME_SPEED,
      paused: false,
    }),

  setIntegrator: (kind) => set({ integrator: kind }),
  setPerturbation: (amount) => set({ perturbation: amount }),

  // Picking a speed implies "run at this speed" — so it also clears pause.
  // Prevents the silent "I clicked 100× but nothing moved" (still paused).
  setTimeSpeed: (speed) => set({ timeSpeed: speed, paused: false }),

  togglePause: () => set((s) => ({ paused: !s.paused })),
}))
