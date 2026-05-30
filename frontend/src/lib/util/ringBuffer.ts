/**
 * Fixed-capacity FIFO ring buffer for Vector3-shaped points.
 *
 * Built for sub-3-3 Light 6 (trails). At 60 fps × N bodies × ~600 trail
 * points each, naive arrays mean thousands of allocations / shifts per
 * second → GC pauses kill the frame budget. This buffer:
 *
 *   - Holds points in one flat `Float32Array` of length `capacity * 3`.
 *     three.js `BufferAttribute` consumes this directly → zero-copy
 *     handoff to the GPU.
 *   - `push(x, y, z)` is O(1): write at the cursor, advance, wrap.
 *   - `forEach` always yields points in *time order* (oldest → newest),
 *     so callers (Trails) can map index → "age" → alpha fade naively.
 *
 * Not body-aware: this stores a scalar sequence of points. The
 * per-body multiplicity lives one layer up in `<Trails>` (Light 6).
 *
 * Not generic over T: hard-coded to (x, y, z) triplets because the
 * one and only client is the trail geometry, which is also triplets.
 * YAGNI — generalize when a second client appears.
 */
export class RingBuffer {
  private readonly buf: Float32Array
  /** Where the NEXT push will write (mod capacity). */
  private head = 0
  /** How many points are currently stored (≤ capacity). */
  private size = 0

  constructor(public readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`RingBuffer capacity must be a positive integer, got ${capacity}`)
    }
    this.buf = new Float32Array(capacity * 3)
  }

  /** Number of points currently stored. */
  get length(): number {
    return this.size
  }

  /** Append one point. Oldest point is silently dropped when full. */
  push(x: number, y: number, z: number): void {
    const i = this.head * 3
    this.buf[i] = x
    this.buf[i + 1] = y
    this.buf[i + 2] = z
    this.head = (this.head + 1) % this.capacity
    if (this.size < this.capacity) this.size += 1
  }

  /**
   * Visit every stored point in time order (oldest → newest).
   * `i` is the iteration index 0..length-1, where 0 = oldest.
   */
  forEach(cb: (x: number, y: number, z: number, i: number) => void): void {
    // When not full, points sit at indices [0, size) in arrival order
    // → start = 0. When full, head points at the OLDEST slot (next to
    // be overwritten) → start = head.
    const start = this.size < this.capacity ? 0 : this.head
    for (let i = 0; i < this.size; i++) {
      const slot = (start + i) % this.capacity
      const j = slot * 3
      cb(this.buf[j], this.buf[j + 1], this.buf[j + 2], i)
    }
  }

  /** Reset to empty. Allocated array is *reused* — no realloc. */
  clear(): void {
    this.head = 0
    this.size = 0
    // The Float32Array is left as-is. forEach won't visit stale data
    // because it's gated by `size`. Avoids re-zeroing thousands of
    // floats every preset switch (3-4).
  }

  /**
   * Direct access to the underlying buffer. Exposed for the trail
   * geometry to point a `BufferAttribute` at it. Callers must treat
   * it as opaque past `length * 3` — those slots hold stale data.
   */
  get rawBuffer(): Float32Array {
    return this.buf
  }
}
