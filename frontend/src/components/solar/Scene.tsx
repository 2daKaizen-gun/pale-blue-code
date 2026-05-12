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
 *   - PLANETS 배열을 .map() 으로 렌더
 *
 * sub-phase 2-2 변경 사항:
 *   - directionalLight 제거 → <Sun /> 안의 pointLight 가 *진짜* 광원
 *     (두 광원 공존 시 빛 방향이 어긋나 교육적 일관성 깨짐)
 *   - <Sun /> 추가 (원점)
 *   - 카메라 초기 position 후퇴 + maxDistance 확대
 *     (해왕성 visualDistance = 50 이라 기존 maxDistance=50 으로는 막힘)
 *
 * 자세한 아키텍처는 docs/specs/phase-2/TECHSPEC.md §2 참조.
 */
export function Scene() {
  return (
    <Canvas
      // 카메라 초기 위치 — 태양계 전체가 한눈에 들어오는 비스듬한 시점.
      // sub-phase 2-1 의 [0,2,5] 는 지구 하나에 맞춰진 값. 이제 태양 + 8개 행성이
      // 흩어져있으니 훨씬 뒤로 후퇴.
      camera={{
        position: [0, 30, 70], // 위에서 비스듬히 내려다보는 각도
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {/* ─── 조명 ───────────────────────────────────────
        * ambient: 완전한 *밤 면* 이 통째로 사라지지 않게 약하게.
        * 광원의 본체는 <Sun /> 안의 pointLight (decay=0, distance=0).
        */}
      <ambientLight intensity={0.15} />

      {/* ─── 태양 (원점) ────────────────────────────────
        * pointLight 를 자식으로 가짐 → 태양 위치에서 사방으로 빛 발산.
        * meshBasicMaterial 로 자체 발광 (빛을 받지 않고 자기 텍스처 그대로).
        */}
      <Sun />

      {/* ─── 행성들 ─────────────────────────────────────
        * PLANETS 가 sub-phase 2-2 [Light 2] 에서 8개로 확장됨.
        * .map() 패턴이라 Scene 코드 변경 없이 자동으로 8개 렌더.
        */}
      {PLANETS.map((planet) => (
        <Planet key={planet.id} data={planet} />
      ))}

      {/* ─── 카메라 컨트롤 ──────────────────────────────
        * minDistance: 태양 안으로 못 들어가게 (visualRadius=8 보다 약간 큼).
        * maxDistance: 해왕성 (visualDistance=50) + 여유. 별 배경 (sub-2-6) 까지 고려.
        */}
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
