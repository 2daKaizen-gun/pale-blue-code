import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { computeAccelerations } from '../../lib/physics/gravity'
import { rk4Step, eulerStep, type AccelFn } from '../../lib/physics/integrators'
import type { SystemState } from '../../lib/physics/types'
import type { RingBuffer } from '../../lib/util/ringBuffer'
import { useGravityStore } from '../../store/gravityStore'
import { advanceAccumulator } from '../../lib/util/substep'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'

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
  /**
   * Per-body trail rings (owned by GravityPage, sibling of bodiesRef). We
   * push a point *per substep* here — not once per frame in <Trails> — so
   * high visual speeds (up to the substep cap) record the whole arc instead
   * of chording it into a polygon (sub-3-7). Writing trails from the loop
   * that actually advances time keeps the invariant "one ring point = one
   * integration step", which makes trail length a *fixed sim-time window*
   * regardless of visual speed.
   */
  trailsRef: React.RefObject<RingBuffer[]>
  /** Gravitational constant in the preset's unit system. */
  G: number
  /** Softening ε. 0 = exact Newton (preset's choice). */
  softening: number
  /**
   * Fixed integration timestep. *Accuracy is determined by dt* — keep it fixed
   * regardless of frame rate OR visual speed (sub-3-6). Speed changes the
   * *number* of dt steps, never their size.
   */
  dt: number
}

/**
 * Substep caps. Visual speed (especially 10,000×) can ask for far more
 * fixed-dt steps than a frame can afford; past this cap the accumulator drops
 * the backlog and we accept "sim-time loss" (visual speed = best effort), so a
 * slow or very fast frame can't snowball into a death spiral.
 *
 * sub-3-7: split desktop/mobile. A touch device runs a tighter cap — fewer
 * worst-case steps per frame protects battery and heat (PRD §6 "모바일은
 * N·substep 상한을 데스크톱보다 보수적으로"). dt is untouched, so accuracy is
 * identical on both; only the *high-speed best-effort ceiling* differs.
 */
const MAX_SUBSTEPS_DESKTOP = 16
const MAX_SUBSTEPS_MOBILE = 8

/**
 * The integrator loop. Renders nothing — its sole job is to march
 * `bodiesRef` forward in time using the verified pure integrator core
 * (RK4 by default; Euler when the soul toggle is flipped), and to sample
 * each body's trail once per substep.
 *
 * Pattern (TechSpec §2, completed in sub-3-6; trail sampling + mobile cap 3-7):
 *   - Fixed physics dt → accuracy is constant across frame rate *and* speed.
 *   - Visual speed = how many fixed-dt steps we take, never a bigger dt. A
 *     fractional accumulator (lib/util/substep) banks sim-time across frames so
 *     0.1× truly slows (sub-one-step/frame) and 10,000× packs many steps in
 *     (up to the substep cap).
 *   - `paused` freezes time: no stepping, and no sim-time banks up while paused.
 *   - The method axis (rk4 | euler) is chosen per frame from control state
 *     (PRD §3, the soul): same law, same dt, different method, different fate.
 *   - `bodiesRef.current = step(...)` per substep — ref replacement, never
 *     in-place mutation of the pure core (sub-3-2 rule).
 *   - Trail push per substep (3-7) — see `trailsRef` doc.
 *   - Control state (integrator / timeSpeed / paused) read via getState() — no
 *     subscription, zero per-frame re-renders (physics-in-ref philosophy).
 */
export function Integrator({ bodiesRef, trailsRef, G, softening, dt }: IntegratorProps) {
  // Curry G / ε into the AccelFn. Stable across frames (deps unchanged).
  const accelOf: AccelFn = useMemo(
    () => (state: SystemState) => computeAccelerations(state, G, softening),
    [G, softening],
  )

  // Tighter substep ceiling on touch devices (battery/heat). Re-renders only
  // when the pointer type actually changes (rare) — useFrame picks up the new
  // value via closure on the next registered callback.
  const isTouch = useIsTouchDevice()
  const maxSubsteps = isTouch ? MAX_SUBSTEPS_MOBILE : MAX_SUBSTEPS_DESKTOP

  // Sim-time banked between frames (always < dt). Reset when the preset's dt
  // changes, so leftover time from one scale doesn't bleed into another.
  const accumulatorRef = useRef(0)
  useEffect(() => {
    accumulatorRef.current = 0
  }, [dt])

  useFrame((_, frameDelta) => {
    const { integrator, timeSpeed, paused } = useGravityStore.getState()

    // Paused freezes time. Returning *before* the accumulator update means no
    // sim-time banks up while paused, so resuming doesn't lurch forward.
    if (paused) return

    const { substeps, accumulator } = advanceAccumulator(
      accumulatorRef.current,
      frameDelta,
      timeSpeed,
      dt,
      maxSubsteps,
    )
    accumulatorRef.current = accumulator
    if (substeps === 0) return // a 0.1× frame where less than one dt has banked

    // Pick the integrator once per frame — the method can't change mid-loop.
    const step = integrator === 'euler' ? eulerStep : rk4Step

    let s = bodiesRef.current
    const trails = trailsRef.current
    for (let k = 0; k < substeps; k++) {
      s = step(s, dt, accelOf)
      // Sample every substep so a high-speed frame's arc stays a curve, not a
      // polygon. One ring point per integration step (3-7).
      for (let i = 0; i < s.length; i++) {
        const ring = trails[i]
        if (!ring) continue // preset-switch transient: rings may lag the state
        const p = s[i].position
        ring.push(p.x, p.y, p.z)
      }
    }
    bodiesRef.current = s
  })

  return null
}
