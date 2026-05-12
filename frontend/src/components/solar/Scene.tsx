import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva } from 'leva';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { PLANETS } from '../../data/planets';

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 안의 3D scene 루트.
 *
 * sub-phase 2-2 변경 사항:
 *   - directionalLight 제거 → <Sun /> 의 pointLight 가 *진짜* 광원
 *   - <Sun /> 추가 (원점)
 *   - 카메라 후퇴 + maxDistance 확대
 *   - .map() 에서 initialAngle 균등 분배
 *   - [Light 5] Leva 패널 추가 (dev only)
 *
 * 자세한 아키텍처는 docs/specs/phase-2/TECHSPEC.md §2 참조.
 */
export function Scene() {
  return (
    <>
      {/* ─── leva 패널 ──────────────────────────────────
        * Canvas 밖, fragment 의 형제로 둠 (Canvas 안에 두면 R3F 가 3D 객체로 해석 시도).
        * hidden 으로 production 에서 자동 숨김 — import.meta.env.DEV 가 false 일 때. */}
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

        <Sun />

        {/* 8개 행성 × 45° 간격으로 태양 둘레에 흩어짐.
          * sub-phase 2-3 에서 공전 도입 시 initialAngle 이 t=0 시점의 시작 각도가 됨. */}
        {PLANETS.map((planet, index) => {
          const initialAngle = (index / PLANETS.length) * Math.PI * 2;
          return (
            <Planet
              key={planet.id}
              data={planet}
              initialAngle={initialAngle}
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
