import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  BufferAttribute,
  Color,
  Line,
  LineBasicMaterial,
} from 'three'
import { RingBuffer } from '../../lib/util/ringBuffer'
import type { SystemState } from '../../lib/physics/types'
import type { PresetBody } from '../../data/presets'

interface TrailsProps {
  bodiesRef: React.RefObject<SystemState>
  presetBodies: PresetBody[]
}

const TRAIL_CAPACITY = 600

/**
 * Tiny per-body z-stagger so coplanar trails don't fight for the same
 * depth slot. 0.001 world-units at camera z=3 → sub-pixel parallax,
 * visually invisible, but enough for the depth buffer to keep each
 * trail in its own slice. Body i lives at z = i · STAGGER.
 */
const Z_STAGGER = 0.001

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
 * Imperative `THREE.Line` + `<primitive>` instead of the `<line>` JSX
 * intrinsic (collides with SVG's `<line>` in R3F v9 / React 19).
 *
 * ─── Compositing: per-body z-stagger (sub-3-3 [L6] final) ───
 *   Two trails on the *same* XY plane → identical depth → submission
 *   order alone decides per pixel → the body drawn last (here: B,
 *   teal) opaquely *covers* A (gold) over the whole orbit, even where
 *   A passed *after* B. Symptom: only the most recent arc of A is
 *   visible because the rest is under B's line.
 *
 *   Tried and rejected:
 *     (×) Additive blending — sums to white where they cross; star
 *         identities blur.
 *     (×) `depthTest: false` alone — still picks one winner per pixel.
 *
 *   Fix: stagger the `Line.position.z` per body by `Z_STAGGER` (0.001
 *   world-units). At camera z=3 this is well below one pixel of
 *   parallax → visually identical to coplanar — but three.js depth-
 *   sorts per object and each trail gets its own slice. Geometry
 *   itself stays XY (the physics is 2D); only the *Line container*
 *   nudges in z.
 *
 *   `depthWrite: false` so trails don't poison depth for the spheres
 *   (which still want correct occlusion when 3-4 brings non-coplanar
 *   bodies).
 *
 * Per-frame work (allocations: 0):
 *   1. `RingBuffer.push(x, y, z)` the current body position.
 *   2. `forEach` (oldest → newest) writes position + per-vertex color.
 *   3. `drawRange(0, length)` gates the GPU read past the live tail.
 *
 * 🌌 What you see: same dt, faster near perihelion → fewer dots there,
 * slower near aphelion → more dots there. Kepler's 2nd law made
 * visible as dot density. sub-3-2 proved L conservation to 10 digits;
 * Trails draw that proof.
 */
export function Trails({ bodiesRef, presetBodies }: TrailsProps) {
  const n = presetBodies.length

  const resources = useMemo<TrailResource[]>(() => {
    return presetBodies.map((body, i) => {
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
      const material = new LineBasicMaterial({
        vertexColors: true,
        depthWrite: false, // don't occlude the spheres
      })
      const line = new Line(geometry, material)
      line.position.z = i * Z_STAGGER // own depth slice
      return {
        buffer: new RingBuffer(TRAIL_CAPACITY),
        geometry,
        material,
        line,
        baseColor: new Color(body.color),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

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
