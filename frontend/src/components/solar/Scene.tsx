import { lazy, Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Planet } from './Planet'
import { Sun } from './Sun'
import { TimeAdvancer } from './TimeAdvancer'
import { CameraController } from './CameraController'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { PLANETS, getInitialAngle } from '../../data/planets'
import { CAMERA_HOME_POSITION } from '../../data/camera'
import { DEFAULT_SCALE, type ScaleConfig } from '../../lib/scale'
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
 * leva 튜닝 패널 — DEV 빌드에서만 동적 import.
 * prod 에선 import.meta.env.DEV 가 false 로 치환되어 이 삼항 분기가 죽고,
 * `import('./DevControls')` 가 DCE 되어 DevControls + leva 가 prod 모듈
 * 그래프에서 사라진다. (sub-2-7 [L7])
 */
const DevControls = import.meta.env.DEV
  ? lazy(() => import('./DevControls'))
  : null

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 루트.
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
 *
 * ─── sub-phase 2-7 [L2] 변경 (성능 계측) ────────────
 *   <Stats /> (drei) 를 dev 전용으로 추가. prod 엔 DEV 가드로 안 들어감.
 *
 * ─── sub-phase 2-7 [L7] 변경 (leva prod 분리) ───────
 *   leva 직접 import + 무조건 useControls 호출을 제거. Scale/Lighting 튜닝은
 *   dev 전용 <DevControls> 로 격리하고 동적 import. prod 는 DEFAULT_SCALE /
 *   DEFAULT_AMBIENT 고정값만 사용 → leva 가 prod 번들에서 빠짐.
 *   leva 의 Time(dev) dropdown 은 ControlPanel 로 대체되어 제거.
 */
export function Scene() {
  // 시각/조명 파라미터. prod 는 기본값 고정, dev 는 <DevControls>(leva)가 갱신.
  const [scale, setScale] = useState<ScaleConfig>(DEFAULT_SCALE)
  const [ambient, setAmbient] = useState(DEFAULT_AMBIENT)

  return (
    <>
      {DevControls && (
        <Suspense fallback={null}>
          <DevControls
            initialScale={DEFAULT_SCALE}
            initialAmbient={DEFAULT_AMBIENT}
            onScaleChange={setScale}
            onAmbientChange={setAmbient}
          />
        </Suspense>
      )}

      <Canvas
        camera={{
          position: [...CAMERA_HOME_POSITION], // 단일 source — data/camera.ts
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: 'var(--color-cosmos-bg, #000)' }}
      >
        {import.meta.env.DEV && <Stats />}

        <TimeAdvancer />

        <CameraController scale={scale} />

        <Starfield />

        <ambientLight intensity={ambient} />

        <Sun scale={scale} />

        {PLANETS.map((planet) => {
          const initialAngle = getInitialAngle(planet.id)
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
