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
import { Ring } from './Ring';

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
 * ─── group 3단 구조 ─────────────────────────────────
 *   [외부 group] position = 공전 위치 (xz 평면, 황도면)
 *     [중간 group] rotation = 자전축 기울기 (z축 기준)
 *       [mesh] rotation.y = 자전
 *       [Ring] 자전축 기울기는 받고, 자기 속도로 독립 회전
 */
export function Planet({ data, initialAngle, scale }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(data.texture);

  const radius = computeVisualRadius(data.realRadius_km, scale);
  const distance = computeVisualDistance(data.realDistance_km, scale);

  const x = Math.cos(initialAngle) * distance;
  const z = Math.sin(initialAngle) * distance;

  const SECONDS_PER_REVOLUTION = 25;

  // 자전 방향 — Ring 에도 전달해 *같은 방향* 회전 (다른 속도로)
  const direction = Math.sign(data.rotationPeriod_hours) || 1;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    meshRef.current.rotation.y += direction * radiansPerSecond * delta;
  });

  const AXIAL_TILT_RAD = (data.axialTilt_deg * Math.PI) / 180;

  return (
    <group position={[x, 0, z]}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial map={texture} />
        </mesh>
        {data.ring && (
          <Ring
            data={data.ring}
            scale={scale}
            rotationDirection={direction}
          />
        )}
      </group>
    </group>
  );
}
