import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { RingData } from '../../data/planets';
import { computeVisualRadius, type ScaleConfig } from '../../lib/scale';

type RingProps = {
  data: RingData;
  scale: ScaleConfig;
};

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Ring — 행성 고리 컴포넌트. 토성/천왕성 두 종류를 *판별 합집합* 으로 처리.
 *
 * ─── 좌표계 ─────────────────────────────────────────
 *   Three.js 의 ringGeometry 는 *xy 평면* 에 그려짐 (정면).
 *   x축 기준 90° 회전 → xz 평면 (황도면) 에 놓임.
 *
 *   Planet.tsx 의 *중간 group* (자전축 기울기 적용된 좌표계) 안에 두면:
 *     - 토성: 26.73° 기울어진 고리 (정확)
 *     - 천왕성: 97.77° → *옆으로 선* 고리 (정확, 시각적 임팩트)
 *
 * ─── 자전과 분리 ────────────────────────────────────
 *   mesh 안이 아닌 *형제* 로 둠 — 자전 영향 받지 않음.
 *   고리는 행성 표면이 아니라 *주변 입자들* 이라 행성과 함께 돌지 않음.
 *
 * ─── hook 규칙 회피 ─────────────────────────────────
 *   useTexture 는 hook → 조건부 호출 불가.
 *   따라서 type 으로 분기 후 각각 별도 컴포넌트로 위임 (RingTextured / RingSolid).
 */
export function Ring({ data, scale }: RingProps) {
  if (data.type === 'texture') {
    return <RingTextured data={data} scale={scale} />;
  }
  return <RingSolid data={data} scale={scale} />;
}

// ─── 토성 같은 텍스처 고리 ──────────────────────────
function RingTextured({
  data,
  scale,
}: {
  data: Extract<RingData, { type: 'texture' }>;
  scale: ScaleConfig;
}) {
  const texture = useTexture(data.texture);
  const inner = computeVisualRadius(data.innerRadius_km, scale);
  const outer = computeVisualRadius(data.outerRadius_km, scale);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      {/* ringGeometry args: [innerRadius, outerRadius, thetaSegments]
        * 64 segments = 둥근 고리. 32 면 다각형이 보임. */}
      <ringGeometry args={[inner, outer, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}   // 양면 보임 (아래에서 볼 때도 안 사라짐)
      />
    </mesh>
  );
}

// ─── 천왕성 같은 단색 고리 ──────────────────────────
function RingSolid({
  data,
  scale,
}: {
  data: Extract<RingData, { type: 'solid' }>;
  scale: ScaleConfig;
}) {
  const inner = computeVisualRadius(data.innerRadius_km, scale);
  const outer = computeVisualRadius(data.outerRadius_km, scale);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
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
