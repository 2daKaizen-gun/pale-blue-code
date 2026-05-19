import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { Planet } from './Planet'
import { Sun } from './Sun'
import { TimeAdvancer } from './TimeAdvancer'
import { CameraController } from './CameraController'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { PLANETS } from '../../data/planets'
import { CAMERA_HOME_POSITION } from '../../data/camera'
import { DEFAULT_SCALE } from '../../lib/scale'
import { useSolarSystemStore } from '../../store/solarSystemStore'

/**
 * sub-phase 2-2 [Light 9] 손튜닝 결과:
 *   - DEFAULT_AMBIENT: 0.15 → 0.3 (행성 밤 면 식별 가능)
 *   - 카메라 position: [0, 30, 70] → [0, 60, 150]
 *     ([Light 7] 갱신: `data/camera.ts` 의 CAMERA_HOME_POSITION 으로 추출 — Scene
 *      초기값과 CameraController home 보간 목표가 *같은 상수* 가리킴)
 */
const DEFAULT_AMBIENT = 0.3

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 루트 + leva 전역 패널.
 *
 * leva 패널은 sub-phase 2-7 까지 유지 (dev only).
 *
 * ─── sub-phase 2-5 [Light 5] 변경 (카메라 추적) ─────
 *   <CameraController /> 추가 — TimeAdvancer 직후, Planet/Sun useFrame *전*.
 *
 * ─── sub-phase 2-5 [Light 6] 변경 (사용자 카메라 충돌 해소) ─
 *   OrbitControls onStart → deselectBody (이때).
 *
 * ─── sub-phase 2-5 [Light 7] 변경 (카메라 home 통합) ──
 *   onStart 호출을 yieldCameraControl 로 *교체*. 의미 확장:
 *     - Light 6: 단순히 selection 해제
 *     - Light 7: selection 해제 + 카메라 자동 제어 양도 (home 보간 중이어도 정지)
 *
 *   home 위치를 `data/camera.ts` 의 CAMERA_HOME_POSITION 상수로 — Scene 초기값과
 *   CameraController home 보간 목표가 *같은 source*. 단일 진실.
 */
export function Scene() {
  const tunedScale = useControls('Scale', {
    radiusExponent: {
      value: DEFAULT_SCALE.radiusExponent,
      min: 0,
      max: 1,
      step: 0.05,
    },
    radiusScale: {
      value: DEFAULT_SCALE.radiusScale,
      min: 0.5,
      max: 3,
      step: 0.1,
    },
    distanceExponent: {
      value: DEFAULT_SCALE.distanceExponent,
      min: 0,
      max: 1,
      step: 0.05,
    },
    distanceScale: {
      value: DEFAULT_SCALE.distanceScale,
      min: 5,
      max: 30,
      step: 0.5,
    },
  })

  const tunedLighting = useControls('Lighting', {
    ambient: {
      value: DEFAULT_AMBIENT,
      min: 0,
      max: 1,
      step: 0.05,
    },
  })

  const tunedTime = useControls('Time (dev)', {
    speed: {
      value: 1,
      options: {
        '정지 (0)': 0,
        '1x (1 day/sec)': 1,
        '100x': 100,
        '10000x': 10000,
        '100000x': 100000,
      },
    },
  })

  useEffect(() => {
    useSolarSystemStore.setState({ timeSpeed: tunedTime.speed })
  }, [tunedTime.speed])

  const scale = import.meta.env.DEV ? tunedScale : DEFAULT_SCALE
  const ambient = import.meta.env.DEV ? tunedLighting.ambient : DEFAULT_AMBIENT

  return (
    <>
      <Leva hidden={!import.meta.env.DEV} />

      <Canvas
        camera={{
          position: [...CAMERA_HOME_POSITION], // 단일 source — data/camera.ts
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: 'var(--color-cosmos-bg, #000)' }}
      >
        <TimeAdvancer />

        <CameraController scale={scale} />

        <Starfield />

        <ambientLight intensity={ambient} />

        <Sun scale={scale} />

        {PLANETS.map((planet, index) => {
          const initialAngle = (index / PLANETS.length) * Math.PI * 2
          return (
            <group key={planet.id}>
              <OrbitPath
                realDistanceKm={planet.realDistance_km}
                scale={scale}
              />
              <Planet
                data={planet}
                initialAngle={initialAngle}
                scale={scale}
              />
            </group>
          )
        })}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={300}
          onStart={() =>
            useSolarSystemStore.getState().yieldCameraControl()
          }
        />
      </Canvas>
    </>
  )
}
