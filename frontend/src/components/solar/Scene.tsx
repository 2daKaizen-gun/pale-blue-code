import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { PLANETS } from '../../data/planets';
import { DEFAULT_SCALE } from '../../lib/scale';

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 안의 3D scene 루트 + leva 전역 패널.
 *
 * sub-phase 2-2 [Light 6] 변경:
 *   - leva: 행성별 9개 폴더 → 전역 'Scale' 1개 폴더 + 4개 슬라이더
 *   - scale: 한 ScaleConfig 객체를 모든 천체에 동일 적용 (prop drilling)
 *
 * sub-phase 2-3 에서 Zustand 도입 시: scale 도 store 로 이동 가능. 일단 prop 으로.
 */
export function Scene() {
  // ─── leva 전역 패널 (Scale) ─────────────────────────
  // 4개 슬라이더로 8개 행성 + 태양 모두 자동 계산.
  // exponent = 0 ~ 1: 압축 강도 (1 = 실제 비율, 0.5 = 제곱근, 0 = 모두 같음)
  // scale    = 결과의 배율
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

  // production 빌드에선 import.meta.env.DEV 가 false → DEFAULT_SCALE 사용.
  // [Light 9] 손튜닝 후 DEFAULT_SCALE 값을 확정.
  const scale = import.meta.env.DEV ? tunedScale : DEFAULT_SCALE;

  return (
    <>
      <Leva hidden={!import.meta.env.DEV} />

      <Canvas
        camera={{
          position: [0, 30, 70],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: 'var(--color-cosmos-bg, #000)' }}
      >
        <ambientLight intensity={0.15} />

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
          maxDistance={200}
        />
      </Canvas>
    </>
  );
}
