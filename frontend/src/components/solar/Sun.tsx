import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SUN } from '../../data/sun';
import { type ScaleConfig, computeVisualRadius } from '../../lib/scale';

type SunProps = {
  scale: ScaleConfig;
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Sun — 태양 컴포넌트.
 *
 * Planet 과의 차이:
 *   1. meshBasicMaterial — 자체 발광 (조명 계산 건너뛰기)
 *   2. <pointLight> 자식 — 태양 위치에서 사방으로 빛 발산
 *   3. 자전축 기울기 없음 (시각화 의미 적음)
 *   4. 거리 = 0 (자기가 원점)
 *
 * sub-phase 2-2 [Light 6] 변경:
 *   - SUN.visualRadius 제거 → computeVisualRadius(SUN.realRadius_km) 호출
 *   - useControls 제거 → Scene 의 전역 'Scale' 패널이 담당
 *
 * 같은 비례 압축 함수를 거치므로, 태양과 행성의 크기 비율이 *수학적으로 일관됨*.
 * 태양 realRadius = 695_700 km (지구의 약 109배) → 압축 후 행성들보다 자연스럽게 큼.
 */
export function Sun({ scale }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(SUN.texture);

  // ─── 비례 압축 ───────────────────────────────────────
  const radius = computeVisualRadius(SUN.realRadius_km, scale);

  const SECONDS_PER_REVOLUTION = 60;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    meshRef.current.rotation.y += radiansPerSecond * delta;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <pointLight
        color={SUN.lightColor}
        intensity={SUN.lightIntensity}
        distance={0}
        decay={0}
      />
    </group>
  );
}
