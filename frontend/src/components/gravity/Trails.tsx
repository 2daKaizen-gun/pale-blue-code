import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, BufferAttribute, Color, Line, LineBasicMaterial } from 'three'
import { RingBuffer } from '../../lib/util/ringBuffer'
import type { SystemState } from '../../lib/physics/types'
import type { PresetBody } from '../../data/presets'

interface TrailsProps {
  /** Read-only here — Integrator owns writes; Trails just samples positions. */
  bodiesRef: React.RefObject<SystemState>
  /** Render metadata (color per body). Index-aligned with `bodiesRef.current`. */
  presetBodies: PresetBody[]
}

/**
 * Trail length per body. ~2.3 orbits at TWO_BODY pace (T ≈ 4.44 sim-sec
 * × 60 fps = 266 frame/orbit; 600 / 266 ≈ 2.3). Long enough to see the
 * full ellipse, short enough to fade visibly — the *living ghost* of
 * Kepler's 2nd law (point density = orbital speed inverse).
 *
 * 3-4 may bump this per-preset (longer orbits, longer trails).
 */
const TRAIL_CAPACITY = 600

/**
 * Per-body bundle of GPU resources + the ring buffer feeding them.
 * Kept together so disposal and per-frame indexing are simple.
 */
interface TrailResource {
  buffer: RingBuffer
  geometry: BufferGeometry
  material: LineBasicMaterial
  line: Line
  baseColor: Color
}

/**
 * Render per-body trails as fade-out lines.
 *
 * Imperative `THREE.Line` + `<primitive object=...>` instead of the
 * `<line>` JSX intrinsic — the latter collides with SVG's `<line>` in
 * R3F v9 / React 19 typings (and the drei `<Line>` wrapper has its
 * own matrix risks; cf. Stars in Light 2). Imperative bypasses both.
 *
 * Per-vertex alpha via `vertexColors: true`: each trail vertex carries
 * an RGB color that fades from `body.color` (newest) to black (oldest).
 * The black canvas background turns RGB→black into a visual alpha fade
 * for free — no ShaderMaterial. Simplest path that holds.
 *
 * Per-frame work (allocations: 0):
 *   1. `RingBuffer.push(x, y, z)` the current body position.
 *   2. `forEach` (oldest → newest) writes position + per-vertex color
 *      directly into the BufferAttribute arrays.
 *   3. `drawRange(0, length)` gates the GPU read so stale slots past
 *      the live tail don't render.
 *
 * Reset trigger: `presetBodies.length` change. 3-3 has one preset so
 * this never fires here. 3-4 preset switch will use a parent `key`
 * to remount Trails — the cleanest reset (geometry/material disposed,
 * fresh buffers).
 *
 * 🌌 What you see: in the same dt, the body covers more arc when near
 * perihelion (faster) than near aphelion (slower) → trail dots end up
 * *sparser at perihelion, denser at aphelion*. Kepler's 2nd law made
 * visible as dot density. sub-3-2 proved L conservation to 10 digits;
 * Trails draw that proof.
 */
export function Trails({ bodiesRef, presetBodies }: TrailsProps) {
  const n = presetBodies.length

  const resources = useMemo<TrailResource[]>(() => {
    return presetBodies.map((body) => {
      const geometry = new BufferGeometry()
      geometry.setAttribute(
        'position',
        new BufferAttribute(new Float32Array(TRAIL_CAPACITY * 3), 3),
      )
      geometry.setAttribute(
        'color',
        new BufferAttribute(new Float32Array(TRAIL_CAPACITY * 3), 3),
      )
      geometry.setDrawRange(0, 0)
      const material = new LineBasicMaterial({ vertexColors: true })
      const line = new Line(geometry, material)
      return {
        buffer: new RingBuffer(TRAIL_CAPACITY),
        geometry,
        material,
        line,
        baseColor: new Color(body.color),
      }
    })
    // Rebuild only when body count changes. presetBodies identity also
    // tied to length in 3-3 (single preset). 3-4 uses key-based remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  // GPU resources are not GC'd by three — dispose on unmount / rebuild.
  useEffect(() => {
    return () => {
      for (const r of resources) {
        r.geometry.dispose()
        r.material.dispose()
      }
    }
  }, [resources])

  useFrame(() => {
    const state = bodiesRef.current
    for (let i = 0; i < state.length; i++) {
      const r = resources[i]
      const p = state[i].position
      r.buffer.push(p.x, p.y, p.z)

      const posAttr = r.geometry.getAttribute('position') as BufferAttribute
      const colAttr = r.geometry.getAttribute('color') as BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array
      const len = r.buffer.length

      r.buffer.forEach((x, y, z, idx) => {
        const k = idx * 3
        posArr[k] = x
        posArr[k + 1] = y
        posArr[k + 2] = z
        // idx 0 = oldest → faded to black; idx len-1 = newest → full color.
        const alpha = len > 1 ? idx / (len - 1) : 1
        colArr[k] = r.baseColor.r * alpha
        colArr[k + 1] = r.baseColor.g * alpha
        colArr[k + 2] = r.baseColor.b * alpha
      })
      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
      r.geometry.setDrawRange(0, len)
    }
  })

  return (
    <>
      {resources.map((r, i) => (
        <primitive key={presetBodies[i].id} object={r.line} />
      ))}
    </>
  )
}
