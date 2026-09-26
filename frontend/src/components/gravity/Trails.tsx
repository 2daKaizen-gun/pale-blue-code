import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, BufferAttribute, Color, Line, LineBasicMaterial } from 'three'
import type { RingBuffer } from '../../lib/util/ringBuffer'
import type { PresetBody } from '../../data/presets'
import { TRAIL_CAPACITY } from '../../constants/gravity'

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * Trails — fade-out path of each body. The visual proof that Kepler's ellipse
 * is *drawn by physics*, not by us.
 *
 * sub-3-7 [fix]: trail sampling moved out of here and into the Integrator's
 * substep loop. The rings themselves are now owned by GravityPage (a sibling
 * of `bodiesRef`); Trails only *reads* them and syncs geometry.
 *
 * Why: a frame at high visual speed runs up to MAX_SUBSTEPS integration steps,
 * sweeping an *arc*. Pushing one point per *frame* (the old design) chorded
 * that arc into a straight segment → the orbit looked like a polygon inscribed
 * in the true curve. Pushing one point per *substep* (now, in Integrator)
 * records every step, so the curve survives. Side effect: a ring now holds
 * "the last N integration steps" — a *fixed sim-time window* independent of
 * visual speed — instead of "the last N frames" (a speed-dependent window).
 *
 * Geometry capacity follows the ring's own `capacity` (single source = the
 * ring GravityPage allocated); `setDrawRange` clips to the live length.
 */
interface TrailsProps {
  /** Per-body trail rings, owned by GravityPage. Read-only here. */
  trailsRef: React.RefObject<RingBuffer[]>
  presetBodies: PresetBody[]
}

const Z_STAGGER = 0.001

interface TrailResource {
  geometry: BufferGeometry
  material: LineBasicMaterial
  line: Line
  baseColor: Color
}

export function Trails({ trailsRef, presetBodies }: TrailsProps) {
  const n = presetBodies.length
  const resources = useMemo<TrailResource[]>(() => {
    return presetBodies.map((body, i) => {
      const cap = TRAIL_CAPACITY
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(cap * 3), 3))
      geometry.setAttribute('color', new BufferAttribute(new Float32Array(cap * 3), 3))
      geometry.setDrawRange(0, 0)
      const material = new LineBasicMaterial({ vertexColors: true, depthWrite: false })
      const line = new Line(geometry, material)
      line.position.z = i * Z_STAGGER
      return { geometry, material, line, baseColor: new Color(body.color) }
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
    const trails = trailsRef.current
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i]
      const buf = trails[i]
      if (!buf) continue // preset-switch transient: rings may briefly outrun resources
      const posAttr = r.geometry.getAttribute('position') as BufferAttribute
      const colAttr = r.geometry.getAttribute('color') as BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array
      const len = buf.length
      buf.forEach((x, y, z, idx) => {
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
