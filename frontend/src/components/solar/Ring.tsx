import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { RingData } from '../../data/planets';
import { computeVisualRadius, type ScaleConfig } from '../../lib/scale';

type RingProps = {
  data: RingData;
  scale: ScaleConfig;
  rotationDirection: number; // +1 또는 -1 (행성의 자전 방향과 동일)
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Ring — 행성 고리 컴포넌트. 토성/천왕성 두 종류를 *판별 합집합* 으로 처리.
 *
 * sub-phase 2-2 [Light 9] 갱신:
 *   - 자전 추가. 행성보다 *느린* 속도로 독립 회전.
 *   - 회전축은 행성 자전축 (중간 group 안에 있으니 자동)
 *   - 회전 방향은 행성과 동일 (rotationDirection prop)
 *
 *   현실은 *차등 회전* (내경 빠름, 외경 느림) 이지만, 시각화에서는
 *   *통합 회전* 으로 단순화. 행성보다 느린 속도가 *별개 천체* 임을 시각적으로 전달.
 *
 * ─── 좌표계 ─────────────────────────────────────────
 *   ringGeometry 는 xy 평면 → x축 90° 회전으로 xz 평면 (황도면) 으로.
 *   회전축은 *원래 ringGeometry 의 z* → 90° 회전 후엔 *y축* → 즉 우리가 일반적으로
 *   생각하는 *고리 면에 수직인 축* (= 행성 자전축).
 */

const SECONDS_PER_REVOLUTION = 50; // 행성 (25초) 의 절반 속도

export function Ring({ data, scale, rotationDirection }: RingProps) {
  if (data.type === 'texture') {
    return (
      <RingTextured
        data={data}
        scale={scale}
        rotationDirection={rotationDirection}
      />
    );
  }
  return (
    <RingSolid
      data={data}
      scale={scale}
      rotationDirection={rotationDirection}
    />
  );
}

// ─── 토성 같은 텍스처 고리 ──────────────────────────
function RingTextured({
  data,
  scale,
  rotationDirection,
}: {
  data: Extract<RingData, { type: 'texture' }>;
  scale: ScaleConfig;
  rotationDirection: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(data.texture);
  const inner = computeVisualRadius(data.innerRadius_km, scale);
  const outer = computeVisualRadius(data.outerRadius_km, scale);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    // rotation.z = ringGeometry 의 *원래 z축* 회전 = 90° 회전 후의 *고리 면 수직축* 회전
    meshRef.current.rotation.z += rotationDirection * radiansPerSecond * delta;
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── 천왕성 같은 단색 고리 ──────────────────────────
function RingSolid({
  data,
  scale,
  rotationDirection,
}: {
  data: Extract<RingData, { type: 'solid' }>;
  scale: ScaleConfig;
  rotationDirection: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const inner = computeVisualRadius(data.innerRadius_km, scale);
  const outer = computeVisualRadius(data.outerRadius_km, scale);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    meshRef.current.rotation.z += rotationDirection * radiansPerSecond * delta;
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 64]} />
      <meshBasicMaterial
        color={data.color}
        transparent
        opacity={data.opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
