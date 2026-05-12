import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { SUN } from '../../data/sun';

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Sun — 태양 컴포넌트. 행성과 *다른 종류* 의 천체이기에 별도 파일.
 *
 * Planet 과의 차이:
 *   1. meshBasicMaterial 사용 — 조명 계산 건너뛰기 (자체 발광 효과)
 *   2. <pointLight> 자식 — 태양 위치에서 사방으로 빛 발산
 *      decay=0, distance=0 → 거리 제곱 감쇠 없음 (TechSpec §5 의식적 단순화)
 *   3. 자전축 기울기 없음 — 태양은 약 7.25° 지만 시각화 의미 적어 생략
 *   4. 자전 — 적도 기준 약 25일 (위도마다 *차등 회전*)
 *
 * sub-phase 2-2 [Light 5]:
 *   leva 통합 — dev 모드에서 visualRadius 라이브 조정.
 *   production 에서는 SUN.visualRadius 그대로 사용.
 */
export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(SUN.texture);

  // ─── leva 패널 (dev only) ────────────────────────────
  // Hook 규칙상 조건부 호출 불가 → 항상 호출 + 값 적용을 환경별로 분기.
  // production 에선 import.meta.env.DEV 가 false → 분기의 dev 쪽이 dead code.
  const tuned = useControls('Sun', {
    radius: {
      value: SUN.visualRadius,
      min: 1,
      max: 20,
      step: 0.5,
    },
  });

  const radius = import.meta.env.DEV ? tuned.radius : SUN.visualRadius;

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
