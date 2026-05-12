import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import type { PlanetData } from '../../data/planets';

type PlanetProps = {
  data: PlanetData;
  initialAngle: number;
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Planet — 행성 하나를 그리는 컴포넌트.
 *
 * 책임:
 *   - sphere geometry (저폴리곤)
 *   - 텍스처 입히기
 *   - 공전 위치 배치 (visualDistance + initialAngle)
 *   - 자전축 기울기 적용
 *   - 매 프레임 자전 (rotationPeriod_hours 의 부호로 방향 결정)
 *
 * sub-phase 2-2 [Light 5]:
 *   leva 통합 — dev 모드에서 visualRadius / visualDistance 라이브 조정.
 *   행성 이름 (en) 으로 leva 폴더 자동 분리 → 8개 행성이 각자 패널 가짐.
 *
 * ─── group 3단 구조 ─────────────────────────────────
 *   [외부 group] position = 공전 위치 (xz 평면, 황도면)
 *     [중간 group] rotation = 자전축 기울기 (z축 기준)
 *       [mesh] rotation.y = 자전 (useFrame 매 프레임 갱신)
 */
export function Planet({ data, initialAngle }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(data.texture);

  // ─── leva 패널 (dev only) ────────────────────────────
  // 행성 이름 (en) 으로 폴더 자동 분리 — leva 패널에 'Mercury', 'Venus', ... 8개 폴더.
  // 첫 인자가 폴더 이름 역할.
  const tuned = useControls(data.name.en, {
    radius: {
      value: data.visualRadius,
      min: 0.1,
      max: 6,
      step: 0.1,
    },
    distance: {
      value: data.visualDistance,
      min: 5,
      max: 80,
      step: 0.5,
    },
  });

  const radius = import.meta.env.DEV ? tuned.radius : data.visualRadius;
  const distance = import.meta.env.DEV ? tuned.distance : data.visualDistance;

  // ─── 공전 위치 (xz 평면) ─────────────────────────────
  const x = Math.cos(initialAngle) * distance;
  const z = Math.sin(initialAngle) * distance;

  // ─── 자전 애니메이션 ─────────────────────────────────
  const SECONDS_PER_REVOLUTION = 25;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    const direction = Math.sign(data.rotationPeriod_hours) || 1;
    meshRef.current.rotation.y += direction * radiansPerSecond * delta;
  });

  // ─── 자전축 기울기 ──────────────────────────────────
  // [Light 6] 에서 data.axialTilt_deg 로 교체 예정.
  const AXIAL_TILT_RAD = (23.5 * Math.PI) / 180;

  return (
    <group position={[x, 0, z]}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      </group>
    </group>
  );
}
