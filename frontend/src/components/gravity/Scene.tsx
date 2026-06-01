import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Bodies } from './Bodies'
import { Integrator } from './Integrator'
import { Trails } from './Trails'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { PerspectiveCamera } from 'three'
import type { SystemState } from '../../lib/physics/types'
import type { CameraConfig, PresetBody, PresetId } from '../../data/presets'

interface SceneProps {
  presetId: PresetId
  bodiesRef: React.RefObject<SystemState>
  presetBodies: PresetBody[]
  camera: CameraConfig
  G: number
  softening: number
  dt: number
}

const DPR: [number, number] = [1, 2]

/**
 * Reframe the *single, never-remounted* camera + controls when the preset
 * changes. sub-3-4 [fix]: keying <PerspectiveCamera>/<OrbitControls> by
 * presetId collided (same key on sibling nodes) → React couldn't unmount
 * cleanly → GPU leak → Context Lost. Imperative reframe keeps one camera +
 * one controls for the Canvas's whole life; only Trails/Bodies remount.
 */
function CameraRig({ camera }: { camera: CameraConfig }) {
  const cam = useThree((s) => s.camera) as PerspectiveCamera
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null
  useEffect(() => {
    cam.position.set(camera.position[0], camera.position[1], camera.position[2])
    cam.far = camera.far
    cam.updateProjectionMatrix()
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.minDistance = camera.minDistance
      controls.maxDistance = camera.maxDistance
      controls.update()
    }
  }, [camera, cam, controls])
  return null
}

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * Scene — R3F Canvas 루트. 텍스처 0 → 안쪽 <Suspense> 불필요 (emissive 점).
 *
 * sub-3-4: 멀티 프리셋.
 *   - 카메라/컨트롤: <CameraRig> 명령형 reframe (remount 안 함 → Context Lost 회피)
 *   - Trails/Bodies: *고유* key 로 remount (버퍼·메시 새로). 형제끼리 key 안 겹침.
 *   - Integrator: 키 없음 — accelOf useMemo([G, softening]) 가 알아서 재생성.
 */
export function Scene({ presetId, bodiesRef, presetBodies, camera, G, softening, dt }: SceneProps) {
  return (
    <Canvas
      dpr={DPR}
      camera={{ position: camera.position, fov: 50, near: 0.01, far: camera.far }}
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {import.meta.env.DEV && <Stats />}

      <CameraRig camera={camera} />

      <Integrator bodiesRef={bodiesRef} G={G} softening={softening} dt={dt} />
      <Trails key={`trails-${presetId}`} bodiesRef={bodiesRef} presetBodies={presetBodies} />
      <Bodies key={`bodies-${presetId}`} bodiesRef={bodiesRef} presetBodies={presetBodies} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={camera.minDistance}
        maxDistance={camera.maxDistance}
      />
    </Canvas>
  )
}
