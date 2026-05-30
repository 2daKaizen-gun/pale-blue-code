import { describe, it, expect } from 'vitest'
import { RingBuffer } from './ringBuffer'

/**
 * Each `it` is a *certificate*: a single invariant that Trails (Light 6)
 * will rely on. Mirrors the sub-3-2 conservation-test pattern — these
 * tests are the *safety net* under the visual trail.
 */
describe('RingBuffer', () => {
  // ─── construction ──────────────────────────────────────
  it('rejects non-positive or non-integer capacity', () => {
    expect(() => new RingBuffer(0)).toThrow()
    expect(() => new RingBuffer(-1)).toThrow()
    expect(() => new RingBuffer(2.5)).toThrow()
  })

  it('starts empty with the requested capacity', () => {
    const r = new RingBuffer(4)
    expect(r.length).toBe(0)
    expect(r.capacity).toBe(4)
    expect(r.rawBuffer.length).toBe(12) // 4 × 3
  })

  // ─── filling below capacity ────────────────────────────
  it('grows length up to capacity as points are pushed', () => {
    const r = new RingBuffer(3)
    r.push(1, 0, 0); expect(r.length).toBe(1)
    r.push(2, 0, 0); expect(r.length).toBe(2)
    r.push(3, 0, 0); expect(r.length).toBe(3)
    r.push(4, 0, 0); expect(r.length).toBe(3) // stays at cap
  })

  // ─── forEach is time-ordered (oldest → newest) ──────────
  it('iterates in time order while not full', () => {
    const r = new RingBuffer(5)
    r.push(1, 0, 0)
    r.push(2, 0, 0)
    r.push(3, 0, 0)
    const xs: number[] = []
    r.forEach((x) => xs.push(x))
    expect(xs).toEqual([1, 2, 3])
  })

  it('iterates oldest→newest after wrap (the central invariant)', () => {
    // capacity 3. Push 5 points. Final state should be the last 3:
    // [3, 4, 5] in time order — NOT in storage order.
    const r = new RingBuffer(3)
    r.push(1, 0, 0)
    r.push(2, 0, 0)
    r.push(3, 0, 0)
    r.push(4, 0, 0) // overwrites slot 0 (which held 1)
    r.push(5, 0, 0) // overwrites slot 1 (which held 2)
    const xs: number[] = []
    r.forEach((x) => xs.push(x))
    expect(xs).toEqual([3, 4, 5])
  })

  it('iteration index matches age (0 = oldest, length-1 = newest)', () => {
    const r = new RingBuffer(3)
    r.push(10, 0, 0)
    r.push(20, 0, 0)
    r.push(30, 0, 0)
    r.push(40, 0, 0) // wraps → oldest is now 20
    const seen: Array<[number, number]> = []
    r.forEach((x, _y, _z, i) => seen.push([i, x]))
    expect(seen).toEqual([
      [0, 20], // oldest
      [1, 30],
      [2, 40], // newest
    ])
  })

  it('preserves all three components per point', () => {
    const r = new RingBuffer(2)
    r.push(1, 2, 3)
    r.push(4, 5, 6)
    const got: number[][] = []
    r.forEach((x, y, z) => got.push([x, y, z]))
    expect(got).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ])
  })

  // ─── clear ─────────────────────────────────────────────
  it('clear() empties without reallocating the buffer', () => {
    const r = new RingBuffer(3)
    r.push(1, 1, 1)
    r.push(2, 2, 2)
    const bufRef = r.rawBuffer
    r.clear()
    expect(r.length).toBe(0)
    expect(r.rawBuffer).toBe(bufRef) // same Float32Array instance
  })

  it('post-clear push behaves like a fresh buffer', () => {
    const r = new RingBuffer(3)
    r.push(99, 0, 0)
    r.push(99, 0, 0)
    r.clear()
    r.push(1, 0, 0)
    r.push(2, 0, 0)
    const xs: number[] = []
    r.forEach((x) => xs.push(x))
    expect(xs).toEqual([1, 2])
  })

  // ─── rawBuffer is the same instance every call (zero-copy contract) ─
  it('rawBuffer returns the same Float32Array across reads', () => {
    const r = new RingBuffer(4)
    expect(r.rawBuffer).toBe(r.rawBuffer)
  })
})
