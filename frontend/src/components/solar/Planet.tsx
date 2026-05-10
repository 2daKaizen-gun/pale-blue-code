import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetData } from '../../data/planets';

type PlanetProps = {
  data: PlanetData;
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Planet — 행성 하나를 그리는 컴포넌트.
 *
 * 책임:
 *   - sphere geometry (저폴리곤)
 *   - 텍스처 입히기
 *   - 자전축 기울기 적용 (지구 = 23.5°)
 *   - 매 프레임 자전 (rotationPeriod_hours 기반)
 *
 * 책임 아닌 것 (sub-phase 2-2 ~ 2-5 에서):
 *   - 공전 (2-3)
 *   - 거리 스케일 토글 (2-4)
 *   - 호버/클릭 인터랙션 (2-5)
 *
 * 자세한 데이터 모델은 docs/specs/phase-2/TECHSPEC.md §3 참조.
 */
export function Planet({ data }: PlanetProps) {
  // ─── 자전 메쉬에 대한 ref ─────────────────────────────
  // useRef 로 mesh 인스턴스를 잡아 useFrame 에서 매 프레임 회전.
  // ref 사용하면 React 리렌더 없이 직접 Three.js 객체 조작 → 60fps 유지의 핵심.
  const meshRef = useRef<THREE.Mesh>(null);

  // ─── 텍스처 로드 ─────────────────────────────────────
  // drei 의 useTexture: <Suspense> 와 자동 통합되어 로딩 중엔 부모 fallback 표시.
  // 현재 SolarSystemPage 가 Suspense 로 감싸지 않아도 R3F 가 알아서 처리.
  const texture = useTexture(data.texture);

  // ─── 자전 애니메이션 ─────────────────────────────────
  // useFrame: 매 프레임 호출 (60fps 기준 초당 60번).
  // delta = 이전 프레임으로부터의 경과 시간 (초). 모니터 주사율 무관하게 일관된 속도.
  //
  // 자전 속도 계산:
  //   rotationPeriod_hours = 한 바퀴에 걸리는 실제 시간 (지구 = 23.934h)
  //   화면 한 바퀴 = 25초 (느긋한 감상용) 로 보임
  //   → 1초당 회전 라디안 = 2π / 25 ≈ 0.2513
  //
  // sub-phase 2-3 에서 시간 속도 컨트롤 도입 시 이 값을 store 와 연동.
  const SECONDS_PER_REVOLUTION = 25; // 화면상 한 바퀴 시간

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    // 자전 방향: rotationPeriod_hours 가 음수면 역회전 (예: 금성)
    const direction = Math.sign(data.rotationPeriod_hours) || 1;
    meshRef.current.rotation.y += direction * radiansPerSecond * delta;
  });

  // ─── 자전축 기울기 ──────────────────────────────────
  // 지구의 자전축은 공전면에 대해 23.5° 기울어져 있음 (계절의 원인).
  // group 으로 감싸 기울기를 부모에 적용하면, 자전(useFrame)은 자식 메쉬에서.
  // 기울기 = 라디안 단위 → 23.5° × π/180.
  //
  // sub-phase 2-2 에서 행성별 axialTilt 값을 PlanetData 에 추가 가능.
  // 지금은 지구만이라 상수로.
  const AXIAL_TILT_RAD = (23.5 * Math.PI) / 180;

  return (
    <group rotation={[0, 0, AXIAL_TILT_RAD]}>
      <mesh ref={meshRef}>
        {/* sphereGeometry args: [반지름, widthSegments, heightSegments]
          * segments = 구의 분할 수. 32×32 = 적당히 매끄럽고 가벼움.
          * TechSpec §6: 모바일 60fps 미달 시 16×16 으로 감소. */}
        <sphereGeometry args={[data.visualRadius, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
}
