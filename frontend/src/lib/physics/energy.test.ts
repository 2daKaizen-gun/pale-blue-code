import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import type { SystemState } from './types'
import { totalEnergy, angularMomentum } from './energy'

describe('totalEnergy', () => {
  it('is pure PE when nothing moves (KE = 0)', () => {
    // Two unit masses, distance 2 apart, at rest. G=1, ε=0.
    // E = 0 + (−G m₁ m₂ / r) = −1/2.
    const s: SystemState = [
      { mass: 1, position: new Vector3(0, 0, 0), velocity: new Vector3(0, 0, 0) },
      { mass: 1, position: new Vector3(2, 0, 0), velocity: new Vector3(0, 0, 0) },
    ]
    expect(totalEnergy(s, 1)).toBeCloseTo(-0.5, 12)
  })

  it('adds ½ m |v|² of kinetic energy per body', () => {
    // Same pair, each moving at speed 1 → KE = ½·1·1 + ½·1·1 = 1, E = 1 − 0.5 = 0.5.
    const s: SystemState = [
      { mass: 1, position: new Vector3(0, 0, 0), velocity: new Vector3(0, 1, 0) },
      { mass: 1, position: new Vector3(2, 0, 0), velocity: new Vector3(0, -1, 0) },
    ]
    expect(totalEnergy(s, 1)).toBeCloseTo(0.5, 12)
  })

  it('uses the softened potential, matching the softened force', () => {
    // r = 2, ε = 1 → PE = −1 / √(4 + 1) = −1/√5.
    const s: SystemState = [
      { mass: 1, position: new Vector3(0, 0, 0), velocity: new Vector3() },
      { mass: 1, position: new Vector3(2, 0, 0), velocity: new Vector3() },
    ]
    expect(totalEnergy(s, 1, 1)).toBeCloseTo(-1 / Math.sqrt(5), 12)
  })

  it('is pure — does not mutate input', () => {
    const s: SystemState = [
      { mass: 1, position: new Vector3(1, 2, 3), velocity: new Vector3(4, 5, 6) },
      { mass: 2, position: new Vector3(-1, 0, 0), velocity: new Vector3() },
    ]
    totalEnergy(s, 1)
    expect(s[0].position.toArray()).toEqual([1, 2, 3])
    expect(s[0].velocity.toArray()).toEqual([4, 5, 6])
  })
})

describe('angularMomentum', () => {
  it('computes m (r × v) for a single body', () => {
    // m=2, r=(1,0,0), v=(0,3,0) → r×v = (0,0,3), L = (0,0,6).
    const s: SystemState = [
      { mass: 2, position: new Vector3(1, 0, 0), velocity: new Vector3(0, 3, 0) },
    ]
    expect(angularMomentum(s).toArray()).toEqual([0, 0, 6])
  })

  it('sums over bodies (a counter-rotating pair adds, not cancels)', () => {
    const s: SystemState = [
      { mass: 1, position: new Vector3(1, 0, 0), velocity: new Vector3(0, 1, 0) },
      { mass: 1, position: new Vector3(-1, 0, 0), velocity: new Vector3(0, -1, 0) },
    ]
    expect(angularMomentum(s).toArray()).toEqual([0, 0, 2])
  })

  it('is pure — does not mutate input', () => {
    const s: SystemState = [
      { mass: 1, position: new Vector3(1, 2, 3), velocity: new Vector3(4, 5, 6) },
    ]
    angularMomentum(s)
    expect(s[0].position.toArray()).toEqual([1, 2, 3])
    expect(s[0].velocity.toArray()).toEqual([4, 5, 6])
  })
})
