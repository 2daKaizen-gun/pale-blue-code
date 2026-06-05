import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Bodies } from './Bodies'
import { Integrator } from './Integrator'
import { Trails } from './Trails'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { PerspectiveCamera } from 'three'
import type { SystemState } from '../../lib/physics/types'
import type { RingBuffer } from '../../lib/util/ringBuffer'
import type { CameraConfig, PresetBody, PresetId } from '../../data/presets'

interface SceneProps {
  presetId: PresetId
  bodiesRef: React.RefObject<SystemState>
  /**
   * Per-body trail rings (owned by GravityPage). Threaded to the Integrator
   * (writes, per substep) and Trails (reads, renders). sub-3-7.
   */
  trailsRef: React.RefObject<RingBuffer[]>
  presetBodies: PresetBody[]
  camera: CameraConfig
  G: number
  softening: number
  dt: number
  /**
   * Chaos seed (three-body). Folded into the Trails key so a nudge starts a
   * *clean* trajectory instead of overlaying the old path on the new fate.
   * 0 for every other preset (reset on preset switch) -> no extra remounts.
   */
  perturbation: number
  /**
   * Reload nonce (sub-3-7). Also folded into the Trails key so re-selecting
   * the *same* preset (reload button / R key) remounts Trails -> clears the
   * rings -> a clean re-seed, even when presetId and perturbation are unchanged.
   */
  presetLoadedAt: number
}

const DPR: [number, number] = [1, 2]

/**
 * Reframe the *single, never-remounted* camera + controls when the preset
 * changes. sub-3-4 [fix]: keying <PerspectiveCamera>/<OrbitControls> by
 * presetId collided (same key on sibling nodes) -> React couldn't unmount
 * cleanly -> GPU leak -> Context Lost. Imperative reframe keeps one camera +
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
 * sub-3-4: 멀티 프리셋. sub-3-5: 카오스 재시드. sub-3-7: trail ring 을
 * GravityPage 가 소유(Integrator write / Trails read) + reload nonce.
 *   - 카메라/컨트롤: <CameraRig> 명령형 reframe (remount 안 함 → Context Lost 회피)
 *   - Trails: key 에 presetId · perturbation · presetLoadedAt → 프리셋 전환,
 *     넛지, *재선택(reload)* 모두에서 자원 새로. 고유 prefix 라 형제끼리 key
 *     안 겹침 (3-4 trouble #1).
 *   - Bodies: key 는 presetId 만 — 넛지/리로드는 천체 *개수* 를 안 바꾸니
 *     메시 remount 불필요. bodiesRef 재시드는 GravityPage 가 렌더 중 동기로
 *     맞춰 길이 갭 없음 (3-4 trouble #2), useFrame 이 다음 틱에 위치 덮음.
 *   - Integrator: 키 없음 — accelOf useMemo([G, softening]) 가 알아서 재생성.
 */
export function Scene({
  presetId,
  bodiesRef,
  trailsRef,
  presetBodies,
  camera,
  G,
  softening,
  dt,
  perturbation,
  presetLoadedAt,
}: SceneProps) {
  return (
    <Canvas
      dpr={DPR}
      camera={{ position: camera.position, fov: 50, near: 0.01, far: camera.far }}
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {import.meta.env.DEV && <Stats />}

      <CameraRig camera={camera} />

      <Integrator
        bodiesRef={bodiesRef}
        trailsRef={trailsRef}
        G={G}
        softening={softening}
        dt={dt}
      />
      <Trails
        key={`trails-${presetId}-${perturbation}-${presetLoadedAt}`}
        trailsRef={trailsRef}
        presetBodies={presetBodies}
      />
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
