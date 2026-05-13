import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { Planet } from './Planet'
import { Sun } from './Sun'
import { TimeAdvancer } from './TimeAdvancer'
import { OrbitPath } from './OrbitPath'
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
 * 더 만져보고 더 좋은 값을 찾으면 위 상수 + DEFAULT_SCALE 갱신.
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   1. <TimeAdvancer /> 를 Canvas 의 첫 자식으로 추가 — 다른 useFrame 보다 먼저 실행
 *   2. leva 의 'Time (dev)' 섹션 추가 — timeSpeed 직접 조작 가능 (개발자 도구)
 *   3. <OrbitPath /> 추가 — 각 행성 자기 궤도 라인. 행성보다 먼저 렌더 (z-order 영향 X 지만 의미상)
 *   4. ControlPanel (사용자 도구) 은 sub-2-3 의 [Light 4-7] 에서 SolarPage 에 추가됨
 *
 *   leva 와 ControlPanel 의 *공존* — sub-2-2 회고의 *개발자 도구 vs 사용자 도구* 분리.
 *   둘 다 같은 store 를 읽지만 UX 책임이 완전히 다름.
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

  // 개발자 도구: timeSpeed 직접 조작. 사용자 ControlPanel 과 별개의 경로.
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

  // leva 의 speed 변경 → store 반영. setState 직접 호출 (개발자 도구라 타입 우회 허용)
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
          position: [0, 60, 150], // distanceScale=20 기준, 해왕성까지 한 화면
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: 'var(--color-cosmos-bg, #000)' }}
      >
        {/* 첫 자식 — 다른 useFrame 보다 먼저 실행되어 simulationDays 갱신 */}
        <TimeAdvancer />

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
        />
      </Canvas>
    </>
  )
}
