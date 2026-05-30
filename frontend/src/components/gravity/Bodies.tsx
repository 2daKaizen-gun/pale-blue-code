import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import type { SystemState } from '../../lib/physics/types'
import type { PresetBody } from '../../data/presets'

interface BodiesProps {
  /**
   * Mutable physics state. The integrator (Light 4) will *replace*
   * `bodiesRef.current` each frame with a new SystemState from
   * `rk4Step(...)`. Bodies reads — never writes — and pipes positions
   * straight onto meshes.
   */
  bodiesRef: React.RefObject<SystemState>
  /**
   * Render metadata (id / color / radius / label) lives in the preset
   * layer per `types.ts` line 18-25. Index-aligned with `bodiesRef.current`.
   */
  presetBodies: PresetBody[]
}

/**
 * Render bodies from `bodiesRef` to mesh positions every frame.
 *
 * Phase 2 *useFrame-derived* paradigm carried over (zero setState per
 * frame; mesh.position writes happen inside useFrame). Phase 2 wrote
 * *derived* positions (angle → orbit); 3-3 writes *actual integration
 * state* — the first time the source of those positions is the laws
 * of physics rather than a hand-drawn ellipse.
 *
 * Materials: `meshBasicMaterial` (emissive, lighting-independent). Two
 * stars in vacuum need no ambient — they *are* the light. Lighting is
 * deferred until 3-4 brings non-luminous bodies (planets / moons).
 *
 * Counts: `presetBodies.length` and `bodiesRef.current.length` are
 * assumed equal and index-aligned. The preset is the single source of
 * both at mount, and the integrator only updates positions/velocities,
 * never the count. 3-4's preset switch will reset both together.
 */
export function Bodies({ bodiesRef, presetBodies }: BodiesProps) {
  const meshRefs = useRef<(Mesh | null)[]>([])

  useFrame(() => {
    const state = bodiesRef.current
    for (let i = 0; i < state.length; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      mesh.position.copy(state[i].position)
    }
  })

  return (
    <>
      {presetBodies.map((body, i) => (
        <mesh
          key={body.id}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          position={body.position} // initial paint before first useFrame tick
        >
          <sphereGeometry args={[body.radius, 32, 32]} />
          <meshBasicMaterial color={body.color} />
        </mesh>
      ))}
    </>
  )
}
