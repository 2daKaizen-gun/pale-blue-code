import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { computeAccelerations } from '../../lib/physics/gravity'
import { rk4Step, eulerStep, type AccelFn } from '../../lib/physics/integrators'
import type { SystemState } from '../../lib/physics/types'
import { useGravityStore } from '../../store/gravityStore'

interface IntegratorProps {
  /**
   * Mutable physics state. `Integrator` *replaces* `.current` with a
   * fresh SystemState every frame (the step fn returns new instances per
   * step). `<Bodies>` reads the same ref and writes mesh positions in its
   * own useFrame. Both useFrames run inside the same R3F render loop — R3F
   * does not guarantee component order, but ref reads/writes within a
   * single frame are coherent because both run before the renderer's
   * `gl.render(...)`. (Phase 2 useFrame-derived precedent.)
   */
  bodiesRef: React.RefObject<SystemState>
  /** Gravitational constant in the preset's unit system. */
  G: number
  /** Softening ε. 0 = exact Newton (preset's choice). */
  softening: number
  /** Fixed integration timestep. *Accuracy is determined by dt* — keep fixed regardless of frame rate. */
  dt: number
}

/**
 * Substep cap. If the frame is slow or `TIME_SPEED` is very large, the
 * loop could try to march too many steps and tank fps. We accept "sim
 * time loss" past this cap (visual speed = best effort). Phase 3 demo
 * scale is small enough that this rarely engages.
 */
const MAX_SUBSTEPS = 16

/**
 * Visual time multiplier. *Compile-time constant* through 3-5.
 *   - 3-6 swaps this for `store.timeSpeed` (paused / 0.1× / 1× / 100× / 10,000×)
 *
 * 3-5 leaves TIME_SPEED a constant and instead adds the *integrator*
 * branch in useFrame below — an orthogonal axis (method, not speed). The
 * substep math is untouched: same dt, same substep count, different step fn.
 *
 * `1` was chosen so the TWO_BODY orbit (T = π√2 ≈ 4.44 sim-sec)
 * completes a revolution in roughly 4 wall-clock seconds at 60 fps —
 * slow enough to *see* the curve, fast enough not to feel stuck.
 */
const TIME_SPEED = 1

/**
 * The integrator loop. Renders nothing — its sole job is to march
 * `bodiesRef` forward in time using the verified pure integrator core
 * (RK4 by default; Euler when the soul toggle is flipped).
 *
 * Pattern (TechSpec §2):
 *   - Fixed physics dt → accuracy is constant across frame rates.
 *   - Per-frame substep count = ⌈(frameDelta · TIME_SPEED) / dt⌉, capped.
 *   - Faster visual speed = more substeps per frame, *not* a bigger dt.
 *   - `bodiesRef.current = step(...)` per substep — ref replacement,
 *     never in-place mutation of the pure core (sub-3-2 rule).
 *   - The step fn (rk4 | euler) is the *method axis* (PRD §3, the soul):
 *     same law, same dt, different method, different universe.
 */
export function Integrator({ bodiesRef, G, softening, dt }: IntegratorProps) {
  // Curry G / ε into the AccelFn. Stable across frames (deps unchanged).
  const accelOf: AccelFn = useMemo(
    () => (state: SystemState) => computeAccelerations(state, G, softening),
    [G, softening],
  )

  useFrame((_, frameDelta) => {
    // Method axis (3-5): pick the integrator once per frame from control
    // state. `getState()` — no subscription, so this never triggers a
    // re-render (physics-in-ref philosophy, sub-3-3/3-4 precedent). Read
    // once per frame, not per substep: the method can't change mid-loop.
    const step =
      useGravityStore.getState().integrator === 'euler' ? eulerStep : rk4Step

    const simSeconds = frameDelta * TIME_SPEED
    const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(simSeconds / dt)))

    let s = bodiesRef.current
    for (let k = 0; k < n; k++) {
      s = step(s, dt, accelOf)
    }
    bodiesRef.current = s
  })

  return null
}
