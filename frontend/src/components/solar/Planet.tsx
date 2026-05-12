import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetData } from '../../data/planets';

type PlanetProps = {
  data: PlanetData;
  initialAngle: number; // 라디안. t=0 시점의 공전 각도 (Scene 이 index 로 분배)
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Planet — 행성 하나를 그리는 컴포넌트.
 *
 * 책임:
 *   - sphere geometry (저폴리곤)
 *   - 텍스처 입히기
 *   - 공전 *위치* 배치 (visualDistance + initialAngle, sub-phase 2-2 [Light 4])
 *   - 자전축 기울기 적용
 *   - 매 프레임 자전 (rotationPeriod_hours 의 부호로 방향 결정)
 *
 * 책임 아닌 것:
 *   - 공전 *애니메이션* — sub-phase 2-3 (initialAngle 을 시간 따라 변하게)
 *   - 거리 스케일 토글 — sub-phase 2-4
 *   - 호버/클릭 인터랙션 — sub-phase 2-5
 *
 * ─── group 3단 구조 ─────────────────────────────────
 *   [외부 group] position = 공전 위치 (xz 평면, 황도면)
 *     [중간 group] rotation = 자전축 기울기 (z축 기준)
 *       [mesh] rotation.y = 자전 (useFrame 매 프레임 갱신)
 *
 *   세 변환을 분리한 이유: 한 group 에 다 박으면 서로 간섭.
 *   특히 sub-phase 2-3 에서 외부 group 의 position 이 시간 따라 변할 때
 *   내부 자전축 / 자전이 영향받지 않게 좌표계를 격리.
 *
 * 자세한 데이터 모델은 docs/specs/phase-2/TECHSPEC.md §3 참조.
 */
export function Planet({ data, initialAngle }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(data.texture);

  // ─── 공전 위치 (xz 평면) ─────────────────────────────
  // 황도면 (ecliptic plane) — 모든 행성이 거의 같은 평면에서 공전.
  //   x = cos(θ) × r,  z = sin(θ) × r
  // sub-phase 2-3 에서 시간 따라 θ 가 변하면 이 계산이 useFrame 안으로 이동.
  const x = Math.cos(initialAngle) * data.visualDistance;
  const z = Math.sin(initialAngle) * data.visualDistance;

  // ─── 자전 애니메이션 ─────────────────────────────────
  // 자전 속도 — 일단 임의값. sub-phase 2-3 의 timeSpeed store 와 연동 예정.
  // rotationPeriod_hours 의 *부호* 만 사용 (음수 = 역회전, 예: 금성).
  const SECONDS_PER_REVOLUTION = 25;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const radiansPerSecond = (2 * Math.PI) / SECONDS_PER_REVOLUTION;
    const direction = Math.sign(data.rotationPeriod_hours) || 1;
    meshRef.current.rotation.y += direction * radiansPerSecond * delta;
  });

  // ─── 자전축 기울기 ──────────────────────────────────
  // [Light 5] 에서 data.axialTilt_deg 로 교체 예정. 일단 23.5° 유지.
  // 23.5° = 지구 기준값 → 현재는 모든 행성이 지구와 같은 기울기로 보임 (부채).
  const AXIAL_TILT_RAD = (23.5 * Math.PI) / 180;

  return (
    <group position={[x, 0, z]}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh ref={meshRef}>
          {/* sphereGeometry args: [반지름, widthSegments, heightSegments]
            * TechSpec §6: 모바일 60fps 미달 시 32 → 16 으로 감소. */}
          <sphereGeometry args={[data.visualRadius, 32, 32]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      </group>
    </group>
  );
}
