import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { Bodies } from './Bodies'
import { Integrator } from './Integrator'
import { Trails } from './Trails'
import type { SystemState } from '../../lib/physics/types'
import type { CameraConfig, PresetBody, PresetId } from '../../data/presets'

interface SceneProps {
  /** Active preset id — keys camera / controls / trails / bodies remount. */
  presetId: PresetId
  bodiesRef: React.RefObject<SystemState>
  presetBodies: PresetBody[]
  /** Per-preset camera framing (sub-3-4). */
  camera: CameraConfig
  /** Physics knobs from the active preset. */
  G: number
  softening: number
  dt: number
}

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * Scene — R3F Canvas 루트.
 *
 * Phase 2 Scene 패턴 미러 (DPR 캡, dev <Stats />, CSS var 배경).
 * 텍스처 0 → 안쪽 <Suspense> 불필요 (3-4 도 emissive 점만, 라이팅 미도입).
 *
 * ─── sub-3-4: 멀티 프리셋 ────────────────────────────
 *   카메라가 더 이상 인라인 상수가 아님. 프리셋마다 스케일이 달라
 *   (2체 ~unit ↔ 태양계 ~수십 AU) `camera` config 를 받아 프레이밍.
 *
 *   `key={presetId}` 로 camera / controls / trails / bodies 를 *함께
 *   remount* → 새 프리셋의 깨끗한 초기 상태 (버퍼·메시·카메라 리셋).
 *   Canvas 자체는 remount 안 함 → WebGL Context Lost 회피 (3-3 교훈).
 *   R3F 의 Canvas `camera` prop 은 mount-only 라 여기선 drei
 *   <PerspectiveCamera> 키 리마운트로 reframe.
 *
 *   Integrator 는 키 없음 — accelOf useMemo([G, softening]) 가
 *   프리셋 변경 시 알아서 재생성.
 */

const DPR: [number, number] = [1, 2]

export function Scene({
  presetId,
  bodiesRef,
  presetBodies,
  camera,
  G,
  softening,
  dt,
}: SceneProps) {
  return (
    <Canvas dpr={DPR} style={{ background: 'var(--color-cosmos-bg, #000)' }}>
      {import.meta.env.DEV && <Stats />}

      <PerspectiveCamera
        key={presetId}
        makeDefault
        position={camera.position}
        fov={50}
        near={0.01}
        far={camera.far}
      />

      <Integrator bodiesRef={bodiesRef} G={G} softening={softening} dt={dt} />
      <Trails key={presetId} bodiesRef={bodiesRef} presetBodies={presetBodies} />
      <Bodies key={presetId} bodiesRef={bodiesRef} presetBodies={presetBodies} />

      <OrbitControls
        key={presetId}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={camera.minDistance}
        maxDistance={camera.maxDistance}
      />
    </Canvas>
  )
}
