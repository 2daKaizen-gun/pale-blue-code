import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { PlanetData } from '../../data/planets'
import {
  type ScaleConfig,
  computeVisualRadius,
  computeVisualDistance,
} from '../../lib/scale'
import {
  computeOrbitAngle,
  computeRotationAngle,
  getEffectiveRotationPeriod,
} from '../../lib/time'
import { useSolarSystemStore } from '../../store/solarSystemStore'
import { Ring } from './Ring'

type PlanetProps = {
  data: PlanetData
  initialAngle: number
  scale: ScaleConfig
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Planet — 행성 하나를 그리는 컴포넌트.
 *
 * ─── group 3단 구조 ─────────────────────────────────
 *   [외부 group, groupRef] position = 공전 위치 (xz 평면, 황도면). 매 프레임 갱신
 *     [중간 group] rotation = 자전축 기울기 (z축 기준). 정적
 *       [mesh, meshRef] rotation.y = 자전. 매 프레임 갱신
 *       [Ring] 자전축 기울기는 받고, 보정된 부모 자전 주기로 독립 회전
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   1. 공전 추가 (지금까지 자전만 있었음). groupRef 의 position 매 프레임 갱신
 *   2. SECONDS_PER_REVOLUTION 상수 제거 → computeRotationAngle / computeOrbitAngle
 *   3. direction 변수 제거 — rotationPeriod_hours 부호가 결과 각도 부호로 자연 전파
 *   4. += 누적 → = 절대 할당. simulationDays 라는 *단일 진실* 에서 매 프레임 다시 계산
 *      → 정지/리셋이 *코드 수정 없이 자동 작동*
 *   5. getEffectiveRotationPeriod 보정 — 금성/천왕성처럼 axial tilt 가 90° 넘으면
 *      좌표계가 뒤집혀 회전이 *외부 관찰자 시각에서 반전됨*. 보정 함수로 상쇄.
 *
 *   *천문학 기반*: 시뮬레이션의 표준 방식은 *절대 시간 (Julian Date 등) → 위치* 계산.
 *   증분 누적은 부동소수점 drift 누적의 위험이 있음.
 */
export function Planet({ data, initialAngle, scale }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)

  const radius = computeVisualRadius(data.realRadius_km, scale)
  const distance = computeVisualDistance(data.realDistance_km, scale)
  const AXIAL_TILT_RAD = (data.axialTilt_deg * Math.PI) / 180

  // axial tilt 90° 초과 행성 (금성 177.4°, 천왕성 97.77°) 의 *좌표계 뒤집힘* 보정
  const effectiveRotationPeriod = getEffectiveRotationPeriod(
    data.rotationPeriod_hours,
    data.axialTilt_deg,
  )

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return
    const { simulationDays } = useSolarSystemStore.getState()

    // 공전: xz 평면의 원 궤도. 외부 group 의 position 갱신
    const orbitAngle = computeOrbitAngle(
      simulationDays,
      data.orbitalPeriod_days,
      initialAngle,
    )
    groupRef.current.position.x = Math.cos(orbitAngle) * distance
    groupRef.current.position.z = Math.sin(orbitAngle) * distance

    // 자전: 보정된 주기 사용 → 외부 관찰자엔 천문학적으로 일관된 방향
    meshRef.current.rotation.y = computeRotationAngle(
      simulationDays,
      effectiveRotationPeriod,
    )
  })

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial map={texture} />
        </mesh>
        {data.ring && (
          <Ring
            data={data.ring}
            scale={scale}
            parentRotationPeriodHours={effectiveRotationPeriod}
          />
        )}
      </group>
    </group>
  )
}
