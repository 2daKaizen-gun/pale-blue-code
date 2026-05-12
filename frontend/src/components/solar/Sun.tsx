import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SUN } from '../../data/sun';

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Sun — 태양 컴포넌트. 행성과 *다른 종류* 의 천체이기에 별도 파일.
 *
 * Planet 과의 차이:
 *   1. meshBasicMaterial 사용 — 조명 계산 건너뛰기 (자체 발광 효과)
 *      행성은 빛을 *받아서* 반사 (PBR), 태양은 *내뿜는* 광원이라 모순 방지.
 *   2. <pointLight> 자식 — 태양 위치에서 사방으로 빛 발산.
 *      decay=0, distance=0 → 거리 제곱 감쇠 없음 (TechSpec §5 의식적 단순화).
 *   3. 자전축 기울기 없음 — 태양은 약 7.25° 지만 시각화 의미 적어 생략.
 *   4. 자전은 함 — 적도 기준 약 25일 (위도마다 다른 *차등 회전*).
 *
 * sub-phase 2-3 에서 store 의 timeSpeed 와 연동 시 SECONDS_PER_REVOLUTION 정정.
 */
export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(SUN.texture);

  // 보기 좋은 임의값. 지구 (25초) 보다 살짝 느리게.
  // sub-phase 2-3 에서 store 와 연동 예정.
  const SECONDS_PER_REVOLUTION = 60;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    meshRef.current.rotation.y += radiansPerSecond * delta;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        {/* 행성보다 segments 살짝 늘림 (32 → 48). 크기가 커서 각진 게 더 눈에 띔. */}
        <sphereGeometry args={[SUN.visualRadius, 48, 48]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* pointLight — 태양 위치에서 사방으로 빛 발산.
        * decay=0: 거리 제곱 감쇠 없음 (해왕성도 햇빛 받음)
        * distance=0: 무한 거리까지 도달
        * TechSpec §5: *의식적 단순화*. 실제는 역제곱 법칙으로 멀수록 약해짐. */}
      <pointLight
        color={SUN.lightColor}
        intensity={SUN.lightIntensity}
        distance={0}
        decay={0}
      />
    </group>
  );
}
