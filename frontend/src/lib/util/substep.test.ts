import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import { advanceAccumulator } from './substep'
import { computeAccelerations } from '../physics/gravity'
import { rk4Step } from '../physics/integrators'
import type { SystemState } from '../physics/types'

describe('advanceAccumulator — count derivation', () => {
  it('runs exactly one step when one dt has banked', () => {
    const dt = 0.05
    const r = advanceAccumulator(0, dt, 1, dt, 16)
    expect(r.substeps).toBe(1)
    expect(r.accumulator).toBeCloseTo(0, 12)
  })

  it('scales the step count linearly with timeSpeed (dt is NEVER scaled)', () => {
    // dt = 1 makes the arithmetic exact: banked = frameDelta · timeSpeed.
    expect(advanceAccumulator(0, 1, 1, 1, 100).substeps).toBe(1)
    expect(advanceAccumulator(0, 1, 2, 1, 100).substeps).toBe(2)
    expect(advanceAccumulator(0, 1, 10, 1, 100).substeps).toBe(10)
  })

  it('caps the step count and drops the backlog (no spiral of death)', () => {
    const r = advanceAccumulator(0, 1, 10_000, 0.001, 16)
    expect(r.substeps).toBe(16)
    expect(r.accumulator).toBe(0) // backlog discarded, not carried
  })

  it('carries the fractional remainder to the next frame', () => {
    const dt = 1
    const a = advanceAccumulator(0, 1.5, 1, dt, 100)
    expect(a.substeps).toBe(1)
    expect(a.accumulator).toBeCloseTo(0.5, 12)

    const b = advanceAccumulator(a.accumulator, 0.7, 1, dt, 100)
    expect(b.substeps).toBe(1) // 0.5 + 0.7 = 1.2 → one step
    expect(b.accumulator).toBeCloseTo(0.2, 12)
  })

  it('banks (does not step) when a single frame buys less than one dt', () => {
    const dt = 0.037
    const r = advanceAccumulator(0, 0.016, 0.1, dt, 16) // 0.1× of a 60fps frame
    expect(r.substeps).toBe(0)
    expect(r.accumulator).toBeCloseTo(0.0016, 12)
  })

  it('still advances at 0.1×, but much slower than 1× (the sub-3-5 fix)', () => {
    const total = (timeSpeed: number) => {
      let acc = 0
      let steps = 0
      for (let f = 0; f < 60; f++) {
        const r = advanceAccumulator(acc, 0.016, timeSpeed, 0.037, 1000)
        acc = r.accumulator
        steps += r.substeps
      }
      return steps
    }
    const slow = total(0.1)
    const normal = total(1)
    expect(slow).toBeGreaterThan(0) // 0.1× genuinely runs (it used to be a no-op)
    expect(normal).toBeGreaterThan(slow * 5) // and is far slower than 1×
  })

  it('returns no steps for a non-positive dt (defensive)', () => {
    expect(advanceAccumulator(5, 1, 1, 0, 16)).toEqual({ substeps: 0, accumulator: 0 })
  })
})

describe('orbit is invariant to per-frame substep chunking (PRD §5)', () => {
  // Self-contained equal-mass circular binary (mirrors the sub-3-2 fixture).
  const G = 1
  const softening = 0
  const dt = (Math.PI * Math.SQRT2) / 600
  const v = Math.SQRT2 / 2

  const makeIC = (): SystemState => [
    { mass: 1, position: new Vector3(-0.5, 0, 0), velocity: new Vector3(0, -v, 0) },
    { mass: 1, position: new Vector3(0.5, 0, 0), velocity: new Vector3(0, v, 0) },
  ]

  const accelOf = (state: SystemState) => computeAccelerations(state, G, softening)

  const runChunks = (chunks: number[]): SystemState => {
    let s: SystemState = makeIC()
    for (const c of chunks) {
      for (let i = 0; i < c; i++) s = rk4Step(s, dt, accelOf)
    }
    return s
  }

  const flat = (s: SystemState) =>
    s.flatMap((b) => [
      b.position.x, b.position.y, b.position.z,
      b.velocity.x, b.velocity.y, b.velocity.z,
    ])

  it('reaches the same state whether 12 substeps run as 1 frame or many', () => {
    const whole = flat(runChunks([12])) // e.g. one fast frame
    const split = flat(runChunks([5, 7])) // two ordinary frames
    const trickle = flat(runChunks([3, 3, 3, 3])) // four slow frames

    // Identical fixed-dt steps in the same order → bit-identical trajectory.
    expect(split).toEqual(whole)
    expect(trickle).toEqual(whole)
  })
})
