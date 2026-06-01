import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, BufferAttribute, Color, Line, LineBasicMaterial } from 'three'
import { RingBuffer } from '../../lib/util/ringBuffer'
import type { SystemState } from '../../lib/physics/types'
import type { PresetBody } from '../../data/presets'
interface TrailsProps { bodiesRef: React.RefObject<SystemState>; presetBodies: PresetBody[] }
const TRAIL_CAPACITY = 600
const Z_STAGGER = 0.001
interface TrailResource { buffer: RingBuffer; geometry: BufferGeometry; material: LineBasicMaterial; line: Line; baseColor: Color }
export function Trails({ bodiesRef, presetBodies }: TrailsProps) {
  const n = presetBodies.length
  const resources = useMemo<TrailResource[]>(() => {
    return presetBodies.map((body, i) => {
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(TRAIL_CAPACITY * 3), 3))
      geometry.setAttribute('color', new BufferAttribute(new Float32Array(TRAIL_CAPACITY * 3), 3))
      geometry.setDrawRange(0, 0)
      const material = new LineBasicMaterial({ vertexColors: true, depthWrite: false })
      const line = new Line(geometry, material)
      line.position.z = i * Z_STAGGER
      return { buffer: new RingBuffer(TRAIL_CAPACITY), geometry, material, line, baseColor: new Color(body.color) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
  useEffect(() => {
    return () => { for (const r of resources) { r.geometry.dispose(); r.material.dispose() } }
  }, [resources])
  useFrame(() => {
    const state = bodiesRef.current
    for (let i = 0; i < state.length; i++) {
      const r = resources[i]
      if (!r) continue // preset-switch transient: bodiesRef may briefly outrun resources
      const p = state[i].position
      r.buffer.push(p.x, p.y, p.z)
      const posAttr = r.geometry.getAttribute('position') as BufferAttribute
      const colAttr = r.geometry.getAttribute('color') as BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array
      const len = r.buffer.length
      r.buffer.forEach((x, y, z, idx) => {
        const k = idx * 3
        posArr[k] = x; posArr[k + 1] = y; posArr[k + 2] = z
        const alpha = len > 1 ? idx / (len - 1) : 1
        colArr[k] = r.baseColor.r * alpha; colArr[k + 1] = r.baseColor.g * alpha; colArr[k + 2] = r.baseColor.b * alpha
      })
      posAttr.needsUpdate = true; colAttr.needsUpdate = true
      r.geometry.setDrawRange(0, len)
    }
  })
  return (<>{resources.map((r, i) => (<primitive key={presetBodies[i].id} object={r.line} />))}</>)
}
