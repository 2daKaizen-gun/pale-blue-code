import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Bodies } from './Bodies'
import { Integrator } from './Integrator'
import { Trails } from './Trails'
import type { SystemState } from '../../lib/physics/types'
import type { PresetBody } from '../../data/presets'

interface SceneProps {
  bodiesRef: React.RefObject<SystemState>
  presetBodies: PresetBody[]
  /** Physics knobs from the active preset (3-3: TWO_BODY only). */
  G: number
  softening: number
  dt: number
}

/**
 * Pale Blue Code — Phase 3: Gravity
 *
 * Scene — R3F Canvas 루트.
 *
 * Phase 2 Scene 패턴을 *의식적으로* 미러링 (sub-2-7 결정의 상속):
 *   - DPR 캡 [1, 2] 모듈 상수
 *   - dev 전용 <Stats /> — prod 는 DEV 가드로 제외
 *   - CSS var 배경
 *
 * Phase 2 와 다른 점 (의식적):
 *   - 텍스처 0 → useTexture suspend 없음 → 안쪽 <Suspense> 불필요
 *     (3-4 태양계 프리셋이 텍스처 도입 시 복원)
 *   - leva 없음 (3-5)
 *   - CameraController 없음 (3-5)
 *   - 라이팅 0 — 별은 meshBasicMaterial 자체발광
 *   - Stars 없음 — drei v10 매트릭스 깨짐 (회고 후보)
 *
 * 채워진 구멍:
 *   - <Bodies /> ← Light 3 ✅
 *   - <Integrator /> ← Light 4 ✅
 *   - <Trails /> ← Light 6 ✅  (페이드 라인 = 케플러 2법칙 시각화)
 *
 * 카메라: TWO_BODY 기준 인라인 상수. 3-4 멀티 프리셋 시 분기.
 */

const DPR: [number, number] = [1, 2]
const CAMERA_POSITION: [number, number, number] = [0, 0, 3]

export function Scene({ bodiesRef, presetBodies, G, softening, dt }: SceneProps) {
  return (
    <Canvas
      dpr={DPR}
      camera={{ position: CAMERA_POSITION, fov: 50, near: 0.01, far: 100 }}
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {import.meta.env.DEV && <Stats />}

      <Integrator bodiesRef={bodiesRef} G={G} softening={softening} dt={dt} />
      <Trails bodiesRef={bodiesRef} presetBodies={presetBodies} />
      <Bodies bodiesRef={bodiesRef} presetBodies={presetBodies} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={20}
      />
    </Canvas>
  )
}
