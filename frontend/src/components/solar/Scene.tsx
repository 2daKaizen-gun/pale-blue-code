import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { PLANETS } from '../../data/planets';

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 안의 3D scene 루트.
 *
 * 이 컴포넌트의 책임:
 *   - <Canvas> 셋업 (camera, renderer)
 *   - 조명 배치 (ambient 만; 광원은 <Sun /> 의 pointLight 가 담당)
 *   - 카메라 컨트롤 (OrbitControls)
 *   - PLANETS 배열을 .map() 으로 렌더 + initialAngle 균등 분배
 *
 * sub-phase 2-2 변경 사항:
 *   - directionalLight 제거 → <Sun /> 의 pointLight 가 *진짜* 광원
 *   - <Sun /> 추가 (원점)
 *   - 카메라 후퇴 + maxDistance 확대 (해왕성 가시 영역)
 *   - .map() 에서 initialAngle 균등 분배 → 행성이 태양 둘레에 흩어짐
 *
 * 자세한 아키텍처는 docs/specs/phase-2/TECHSPEC.md §2 참조.
 */
export function Scene() {
  return (
    <Canvas
      // 카메라 초기 위치 — 태양계 전체를 위에서 비스듬히 내려다보는 시점.
      // [0, 30, 70]: y=30 (위), z=70 (뒤) → 황도면이 비스듬히 보여 깊이감 살아남.
      camera={{
        position: [0, 30, 70],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {/* ─── 조명 ───────────────────────────────────────
        * ambient: 완전한 *밤 면* 이 통째로 사라지지 않게 약하게.
        * 광원의 본체는 <Sun /> 안의 pointLight (decay=0, distance=0). */}
      <ambientLight intensity={0.15} />

      {/* ─── 태양 (원점) ──────────────────────────────── */}
      <Sun />

      {/* ─── 행성들 ─────────────────────────────────────
        * initialAngle 균등 분배 — 8개 행성 × 45° 간격으로 태양 둘레에 흩어짐.
        *   수성(0°) → 금성(45°) → 지구(90°) → 화성(135°) → 목성(180°)
        *   → 토성(225°) → 천왕성(270°) → 해왕성(315°)
        *
        * sub-phase 2-3 에서 공전 도입 시: 이 initialAngle 이 *t=0 시점의 시작 각도*
        * 가 되고, store 의 시간 진행에 따라 각 행성이 자기 주기로 각도 증가. */}
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

      {/* ─── 카메라 컨트롤 ──────────────────────────────
        * minDistance: 태양 안으로 못 들어가게 (visualRadius=8 보다 약간 큼).
        * maxDistance: 해왕성 (visualDistance=50) + 여유. */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={200}
      />
    </Canvas>
  );
}
