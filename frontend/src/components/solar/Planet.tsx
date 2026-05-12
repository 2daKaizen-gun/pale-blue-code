import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetData } from '../../data/planets';
import {
  type ScaleConfig,
  computeVisualRadius,
  computeVisualDistance,
} from '../../lib/scale';

type PlanetProps = {
  data: PlanetData;
  initialAngle: number;
  scale: ScaleConfig;
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Planet — 행성 하나를 그리는 컴포넌트.
 *
 * 책임:
 *   - sphere geometry (저폴리곤)
 *   - 텍스처 입히기
 *   - 공전 위치 배치 (computeVisualDistance + initialAngle)
 *   - 자전축 기울기 적용
 *   - 매 프레임 자전 (rotationPeriod_hours 의 부호로 방향 결정)
 *
 * sub-phase 2-2 [Light 6] 변경:
 *   - data.visualRadius / data.visualDistance 제거 → scale 함수 호출
 *   - 행성별 leva useControls 제거 → Scene 의 전역 'Scale' 패널이 담당
 *   - scale prop 추가 (sub-2-3 Zustand 도입 시 store 로 이동 가능)
 *
 * ─── group 3단 구조 ─────────────────────────────────
 *   [외부 group] position = 공전 위치 (xz 평면, 황도면)
 *     [중간 group] rotation = 자전축 기울기 (z축 기준)
 *       [mesh] rotation.y = 자전 (useFrame 매 프레임 갱신)
 */
export function Planet({ data, initialAngle, scale }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(data.texture);

  // ─── 비례 압축으로 시각 값 계산 ─────────────────────
  const radius = computeVisualRadius(data.realRadius_km, scale);
  const distance = computeVisualDistance(data.realDistance_km, scale);

  // ─── 공전 위치 (xz 평면, 황도면) ─────────────────────
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
  // [Light 7] 에서 data.axialTilt_deg 로 교체 예정.
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
