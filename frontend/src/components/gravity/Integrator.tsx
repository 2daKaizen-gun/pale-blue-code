import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { computeAccelerations } from '../../lib/physics/gravity'
import { rk4Step, type AccelFn } from '../../lib/physics/integrators'
import type { SystemState } from '../../lib/physics/types'

interface IntegratorProps {
  /**
   * Mutable physics state. `Integrator` *replaces* `.current` with a
   * fresh SystemState every frame (RK4 returns new instances per step).
   * `<Bodies>` reads the same ref and writes mesh positions in its own
   * useFrame. Both useFrames run inside the same R3F render loop — R3F
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
 * Visual time multiplier. *Compile-time constant* in 3-3.
 *   - 3-5 swaps this for `store.integrator` toggle ('rk4' | 'euler')
 *   - 3-6 swaps this for `store.timeSpeed` (paused / 0.1× / 1× / 100× / 10,000×)
 * The swap is additive — the substep math is already structured for it.
 *
 * `1` was chosen so the TWO_BODY orbit (T = π√2 ≈ 4.44 sim-sec)
 * completes a revolution in roughly 4 wall-clock seconds at 60 fps —
 * slow enough to *see* the curve, fast enough not to feel stuck.
 */
const TIME_SPEED = 1

/**
 * The integrator loop. Renders nothing — its sole job is to march
 * `bodiesRef` forward in time using the verified pure RK4 core.
 *
 * Pattern (TechSpec §2):
 *   - Fixed physics dt → accuracy is constant across frame rates.
 *   - Per-frame substep count = ⌈(frameDelta · TIME_SPEED) / dt⌉, capped.
 *   - Faster visual speed = more substeps per frame, *not* a bigger dt.
 *   - `bodiesRef.current = rk4Step(...)` per substep — ref replacement,
 *     never in-place mutation of the pure core (sub-3-2 rule).
 */
export function Integrator({ bodiesRef, G, softening, dt }: IntegratorProps) {
  // Curry G / ε into the AccelFn. Stable across frames (deps unchanged).
  const accelOf: AccelFn = useMemo(
    () => (state: SystemState) => computeAccelerations(state, G, softening),
    [G, softening],
  )

  useFrame((_, frameDelta) => {
    const simSeconds = frameDelta * TIME_SPEED
    const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(simSeconds / dt)))

    let s = bodiesRef.current
    for (let k = 0; k < n; k++) {
      s = rk4Step(s, dt, accelOf)
    }
    bodiesRef.current = s
  })

  return null
}
