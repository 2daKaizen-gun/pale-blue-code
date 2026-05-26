import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import type { SystemState } from './types'
import { computeAccelerations } from './gravity'

function body(mass: number, pos: [number, number, number]) {
  return { mass, position: new Vector3(...pos), velocity: new Vector3() }
}

function expectVec(v: Vector3, [x, y, z]: [number, number, number], precision = 10) {
  expect(v.x).toBeCloseTo(x, precision)
  expect(v.y).toBeCloseTo(y, precision)
  expect(v.z).toBeCloseTo(z, precision)
}

describe('computeAccelerations', () => {
  const G = 1

  it('pulls two bodies toward each other (direction + magnitude)', () => {
    const sys: SystemState = [body(1, [0, 0, 0]), body(1, [1, 0, 0])]
    const [aA, aB] = computeAccelerations(sys, G)
    expectVec(aA, [1, 0, 0]) // A accelerates +x, toward B
    expectVec(aB, [-1, 0, 0]) // B accelerates -x, toward A
  })

  it('obeys the inverse-square law (distance x2 -> acceleration /4)', () => {
    const sys: SystemState = [body(1, [0, 0, 0]), body(1, [2, 0, 0])]
    const [aA] = computeAccelerations(sys, G)
    expectVec(aA, [0.25, 0, 0])
  })

  it("does not depend on the accelerated body's own mass (Galileo)", () => {
    const light: SystemState = [body(1, [0, 0, 0]), body(5, [1, 0, 0])]
    const heavy: SystemState = [body(1000, [0, 0, 0]), body(5, [1, 0, 0])]
    const [aLight] = computeAccelerations(light, G)
    const [aHeavy] = computeAccelerations(heavy, G)
    expectVec(aLight, [5, 0, 0])
    expectVec(aHeavy, [5, 0, 0]) // identical despite 1000x mass
  })

  it("conserves momentum: sum of m*a = 0 (Newton's third law)", () => {
    const sys: SystemState = [body(2, [0, 0, 0]), body(3, [1, 0, 0])]
    const [aA, aB] = computeAccelerations(sys, G)
    const net = new Vector3().addScaledVector(aA, 2).addScaledVector(aB, 3)
    expectVec(net, [0, 0, 0])
  })

  it('does not mutate the input bodies (pure function)', () => {
    const sys: SystemState = [body(1, [0, 0, 0]), body(1, [1, 0, 0])]
    computeAccelerations(sys, G)
    expectVec(sys[0].position, [0, 0, 0])
    expectVec(sys[1].position, [1, 0, 0])
    expectVec(sys[0].velocity, [0, 0, 0])
  })

  it('stays finite as r->0 thanks to softening', () => {
    const coincident: SystemState = [body(1, [0, 0, 0]), body(1, [0, 0, 0])]
    const [aA] = computeAccelerations(coincident, G, 0.1)
    expect(Number.isFinite(aA.x)).toBe(true)
    expect(Number.isFinite(aA.y)).toBe(true)
    expect(Number.isFinite(aA.z)).toBe(true)

    // softening caps the blow-up: near-zero separation stays bounded
    const close: SystemState = [body(1, [0, 0, 0]), body(1, [0.001, 0, 0])]
    const softened = computeAccelerations(close, G, 0.1)[0].length()
    const hard = computeAccelerations(close, G, 0)[0].length()
    expect(softened).toBeLessThan(hard)
  })
})
