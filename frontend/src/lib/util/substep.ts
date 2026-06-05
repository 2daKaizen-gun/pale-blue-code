/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * Substep accumulator — the render-loop wrapper that turns "visual speed" into
 * a whole number of *fixed-dt* physics substeps per frame, WITHOUT ever
 * touching dt.
 *
 * This is the answer to the handoff's core question: separate the integration
 * timestep from the speed slider. The trap it avoids is scaling dt by speed —
 * a bigger dt is exactly how Euler breaks the universe (sub-3-5), and it makes
 * RK4 coarser too. So accuracy must come from a *fixed* dt; speed must come
 * from *how many* fixed-dt steps we take.
 *
 * The naive "ceil(frameDelta·speed / dt), floored at 1" (3-3..3-5) cannot
 * represent fewer than one step per frame, so 0.1× collapses into 1× for a fine
 * dt — and it is frame-rate dependent. A fractional accumulator fixes both: we
 * bank sim-time across frames and spend it in whole dt chunks.
 *
 *   bank  += frameDelta · timeSpeed   // sim-time this frame buys
 *   steps  = floor(bank / dt)         // whole fixed-dt steps we can afford
 *   bank  -= steps · dt               // carry the remainder to next frame
 *
 * Determinism is preserved: the *sequence* of states visited is step^k(s₀) for
 * k = 0,1,2,… regardless of speed; the accumulator only decides *when* each
 * step fires. Same IC at any speed → same orbit (PRD §5). This sits *above* the
 * verified pure core (sub-3-2) — `rk4Step`/`eulerStep` are never re-touched.
 * Two layers, never conflated (handoff principle): the integrators are the pure
 * ODE core; this is the wrapper that paces them.
 */

export interface SubstepResult {
  /** Whole fixed-dt steps to run this frame (0 when too little time has banked). */
  substeps: number
  /** Sim-time banked for the next frame (always < dt, or 0 when capped). */
  accumulator: number
}

/**
 * Advance the fixed-timestep accumulator by one frame.
 *
 * @param accumulator  sim-time carried from the previous frame (≥ 0, < dt)
 * @param frameDelta   real seconds since the last frame (R3F useFrame delta)
 * @param timeSpeed    visual speed multiplier (sim-seconds per real-second)
 * @param dt           fixed integration timestep (preset.recommendedDt)
 * @param maxSubsteps  hard cap; excess sim-time is dropped (no spiral of death)
 */
export function advanceAccumulator(
  accumulator: number,
  frameDelta: number,
  timeSpeed: number,
  dt: number,
  maxSubsteps: number,
): SubstepResult {
  // dt must be positive (a preset bug otherwise): no steps, no carry.
  if (dt <= 0) return { substeps: 0, accumulator: 0 }

  // Clamp inputs to ≥ 0: a negative frameDelta/speed would run time backward.
  const banked = accumulator + Math.max(0, frameDelta) * Math.max(0, timeSpeed)
  const rawSteps = Math.floor(banked / dt)

  if (rawSteps > maxSubsteps) {
    // Past the cap we accept "sim-time loss" (visual speed = best effort) and
    // drop the backlog, so a slow or very fast frame can't snowball forever.
    return { substeps: maxSubsteps, accumulator: 0 }
  }

  return { substeps: rawSteps, accumulator: banked - rawSteps * dt }
}
