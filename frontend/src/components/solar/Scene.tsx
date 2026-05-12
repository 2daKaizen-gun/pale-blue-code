import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { PLANETS } from '../../data/planets';
import { DEFAULT_SCALE } from '../../lib/scale';

/**
 * sub-phase 2-2 [Light 9] 손튜닝 결과:
 *   - DEFAULT_AMBIENT: 0.15 → 0.3 (행성 밤 면 식별 가능)
 *   - 카메라 position: [0, 30, 70] → [0, 60, 150]
 *     (distanceScale=20 적용 후 해왕성 거리 109 까지 한 화면에)
 */
const DEFAULT_AMBIENT = 0.3;

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 루트 + leva 전역 패널.
 *
 * leva 패널은 sub-phase 2-7 까지 유지 (dev only).
 * 더 만져보고 더 좋은 값을 찾으면 위 상수 + DEFAULT_SCALE 갱신.
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
  });

  const tunedLighting = useControls('Lighting', {
    ambient: {
      value: DEFAULT_AMBIENT,
      min: 0,
      max: 1,
      step: 0.05,
    },
  });

  const scale = import.meta.env.DEV ? tunedScale : DEFAULT_SCALE;
  const ambient = import.meta.env.DEV ? tunedLighting.ambient : DEFAULT_AMBIENT;

  return (
    <>
      <Leva hidden={!import.meta.env.DEV} />

      <Canvas
        camera={{
          position: [0, 60, 150],   // distanceScale=20 기준, 해왕성까지 한 화면
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: 'var(--color-cosmos-bg, #000)' }}
      >
        <ambientLight intensity={ambient} />

        <Sun scale={scale} />

        {PLANETS.map((planet, index) => {
          const initialAngle = (index / PLANETS.length) * Math.PI * 2;
          return (
            <Planet
              key={planet.id}
              data={planet}
              initialAngle={initialAngle}
              scale={scale}
            />
          );
        })}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={300}        // 카메라 후퇴에 맞춰 maxDistance 도 확대
        />
      </Canvas>
    </>
  );
}
