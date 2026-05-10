import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Planet } from './Planet';
import { PLANETS } from '../../data/planets';

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Scene — R3F Canvas 안의 3D scene 루트.
 *
 * 이 컴포넌트의 책임:
 *   - <Canvas> 셋업 (camera, renderer)
 *   - 조명 배치 (ambient + 태양 자리의 directional)
 *   - 카메라 컨트롤 (OrbitControls)
 *   - PLANETS 배열을 .map() 으로 렌더 (2-2 에서 1개 → 8개 확장 시 코드 변경 0)
 *
 * 책임 아닌 것 (다른 컴포넌트로):
 *   - 행성 자체 렌더링 → <Planet />
 *   - 컨트롤 패널 → <ControlPanel /> (Canvas 밖)
 *   - 카메라 보간 → <CameraController /> (sub-phase 2-5)
 *
 * 자세한 아키텍처는 docs/specs/phase-2/TECHSPEC.md §2 참조.
 */
export function Scene() {
  return (
    <Canvas
      // 카메라 초기 위치 — 지구를 비스듬히 위에서 내려다보기
      camera={{
        position: [0, 2, 5], // x, y, z (R3F 기본 단위, 지구 반지름 = 1)
        fov: 50,             // 시야각 (도). 50° = 표준 렌즈 느낌
        near: 0.1,           // 가장 가까운 가시 거리
        far: 1000,           // 가장 먼 가시 거리 (Phase 2-2 에서 멀리 행성 추가 시 충분)
      }}
      // 우주 배경 — 토큰의 cosmos-bg 사용
      style={{ background: 'var(--color-cosmos-bg, #000)' }}
    >
      {/* ─── 조명 ───────────────────────────────────────
        * ambient: 모든 면에 약한 균일 조명. 어두운 면이 완전 검정 되지 않게.
        * directional: 태양 자리 (원점 부근) 에서 발산하는 강한 평행광.
        *   실제 태양처럼 거리 제곱 감쇠는 안 함 (TechSpec §5 알려진 한계).
        */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.5}
        color="#fff5e6" // 약간 노란 햇빛
      />

      {/* ─── 행성들 ─────────────────────────────────────
        * PLANETS 는 sub-phase 2-1 에서 지구 1개, 2-2 에서 8개로 확장.
        * .map() 패턴이라 Scene 코드는 변경 없이 자동으로 8개 렌더.
        */}
      {PLANETS.map((planet) => (
        <Planet key={planet.id} data={planet} />
      ))}

      {/* ─── 카메라 컨트롤 ──────────────────────────────
        * 마우스 드래그 = 회전, 휠 = 줌, 우클릭 드래그 = 팬.
        * makeDefault: 다른 컴포넌트가 useThree() 로 controls 접근 가능 (2-5 에서 활용).
        */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={1.5}  // 너무 가까이 줌 못 들어가게 (행성 안으로 들어감 방지)
        maxDistance={50}   // 너무 멀리 못 빠지게 (sub-phase 2-2 에서 행성 추가 후 다시 조정)
      />
    </Canvas>
  );
}
