import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SUN } from '../../data/sun'
import { type ScaleConfig, computeVisualRadius } from '../../lib/scale'
import {
  computeRotationAngle,
  getInterpolatedRotationPeriod,
} from '../../lib/time'
import {
  computeTransitionProgress,
  easeInOutCubic,
} from '../../lib/easing'
import {
  useSolarSystemStore,
  TRANSITION_DURATION_MS,
} from '../../store/solarSystemStore'

type SunProps = {
  scale: ScaleConfig
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Sun — 태양 컴포넌트.
 *
 * Planet 과의 차이:
 *   1. meshBasicMaterial — 자체 발광 (조명 계산 건너뛰기)
 *   2. <pointLight> 자식 — 태양 위치에서 사방으로 빛 발산
 *   3. 자전축 기울기 없음 (시각화 의미 적음) → axial-flip 보정 *생략*
 *   4. 거리 = 0 (자기가 원점) → 거리 토글 영향 없음, distance 보간도 불필요
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   SECONDS_PER_REVOLUTION 상수 제거. simulationDays 기반 computeRotationAngle.
 *   += → = 절대 할당. 정지/리셋 시 자동으로 그 시점 각도 유지.
 *
 * ─── sub-phase 2-4 [Light 7] 변경 (자전 보간) ──────
 *   `SUN.rotationPeriod_hours` 정적 사용 → 매 프레임 보간된 period 적용.
 *
 *   합성: real → getInterpolatedRotationPeriod → computeRotationAngle
 *   (Planet/Ring 보다 한 단계 짧음 — axial-flip 보정 없음)
 *
 *   태양 자전 주기: 25.38일 (적도 기준 609.12h).
 *     visual 압축: sqrt(609.12/24) × 24 ≈ 121h (5일).
 *     real 모드 토글 시 *태양도 5배 느려진다* — *모든 천체* 가 케플러 비례 따른다는 일관성.
 *
 *   실제 태양은 *위도마다 다른 차등 자전* (적도 25일, 극지 35일) 이지만 시각화는
 *   단일 속도. 가스 덩어리라 적도가 가장 빠름.
 */
export function Sun({ scale }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(SUN.texture)

  const radius = computeVisualRadius(SUN.realRadius_km, scale)

  useFrame(() => {
    if (!meshRef.current) return
    const {
      simulationDays,
      rotationMode,
      rotationModeChangedAt,
    } = useSolarSystemStore.getState()

    const rotationProgress = easeInOutCubic(
      computeTransitionProgress(
        performance.now(),
        rotationModeChangedAt,
        TRANSITION_DURATION_MS,
      ),
    )
    const interpolatedPeriod = getInterpolatedRotationPeriod(
      SUN.rotationPeriod_hours,
      rotationMode,
      rotationProgress,
    )
    meshRef.current.rotation.y = computeRotationAngle(
      simulationDays,
      interpolatedPeriod,
    )
  })

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
  )
}
