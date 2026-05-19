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
import { DEFAULT_SCALE } from '../../lib/scale'
import { useSolarSystemStore } from '../../store/solarSystemStore'

/**
 * sub-phase 2-2 [Light 9] 손튜닝 결과:
 *   - DEFAULT_AMBIENT: 0.15 → 0.3 (행성 밤 면 식별 가능)
 *   - 카메라 position: [0, 30, 70] → [0, 60, 150]
 *     (distanceScale=20 적용 후 해왕성 거리 109 까지 한 화면에)
 */
const DEFAULT_AMBIENT = 0.3

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 루트 + leva 전역 패널.
 *
 * leva 패널은 sub-phase 2-7 까지 유지 (dev only).
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   <TimeAdvancer /> 첫 자식, leva 'Time (dev)', <OrbitPath />.
 *
 * ─── sub-phase 2-3 [Light 8] 변경 ──────────────────
 *   <Starfield /> 추가.
 *
 * ─── sub-phase 2-5 [Light 5] 변경 (카메라 추적) ─────
 *   <CameraController /> 추가 — TimeAdvancer 직후, Planet/Sun useFrame *전*.
 *   같은 시각의 simulationDays 로 위치 도출 → 어긋남 X.
 *
 * ─── sub-phase 2-5 [Light 6] 변경 (사용자 카메라 충돌 해소) ─
 *   OrbitControls 의 `onStart` 콜백 = 사용자 마우스/터치 시작 시 호출.
 *   여기서 `deselectBody()` 호출 → selectedBodyId=null → CameraController 손 떼기.
 *
 *   결의 의미: *사용자 의도가 카메라 추적 의도보다 우선*. 추적 중 사용자가
 *   직접 카메라 만지면, 자동 추적 코드가 *물러난다*. 한 카메라에 두 주인 없음.
 *
 *   사용자 흐름:
 *     1. 행성 클릭 → CameraController 추적 시작
 *     2. 추적 중 마우스 만지면 onStart 발화 → deselect → CameraController 즉시 손 떼기
 *     3. 사용자 자유 카메라 가능 (라벨도 사라짐 — 호버 안 한 상태면)
 *
 *   onStart vs onChange 의 선택:
 *     - onChange = OrbitControls 가 카메라를 바꿀 때마다. CameraController 가 update()
 *       하는 것도 OrbitControls 입장에서 'change' → 무한 루프.
 *     - onStart = *사용자 입력 시작* 시만. 코드 호출은 미발화. ✅
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
          position: [0, 60, 150],
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
          onStart={() => useSolarSystemStore.getState().deselectBody()}
        />
      </Canvas>
    </>
  )
}
