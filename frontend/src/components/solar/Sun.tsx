import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SUN } from '../../data/sun'
import { type ScaleConfig, computeVisualRadius } from '../../lib/scale'
import { computeRotationAngle } from '../../lib/time'
import { useSolarSystemStore } from '../../store/solarSystemStore'

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
 *   3. 자전축 기울기 없음 (시각화 의미 적음)
 *   4. 거리 = 0 (자기가 원점) — 공전 useFrame 불필요
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   SECONDS_PER_REVOLUTION 상수 제거. simulationDays 기반 computeRotationAngle 호출.
 *   += 누적 → = 절대 할당. 정지/리셋 시 자동으로 그 시점 각도 유지.
 *
 *   태양 자전: 적도 기준 25.38일 (≈ 609.12h). 실제는 위도마다 다른 *차등 자전* 이지만
 *   시각화에서는 단일 속도. 가스 덩어리라 적도가 가장 빠름.
 */
export function Sun({ scale }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(SUN.texture)

  const radius = computeVisualRadius(SUN.realRadius_km, scale)

  useFrame(() => {
    if (!meshRef.current) return
    const { simulationDays } = useSolarSystemStore.getState()
    meshRef.current.rotation.y = computeRotationAngle(
      simulationDays,
      SUN.rotationPeriod_hours,
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
