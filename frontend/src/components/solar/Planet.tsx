import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { PlanetData } from '../../data/planets'
import {
  type ScaleConfig,
  computeVisualRadius,
  computeVisualDistance,
  getInterpolatedScaleConfig,
} from '../../lib/scale'
import {
  computeOrbitAngle,
  computeRotationAngle,
  getEffectiveRotationPeriod,
} from '../../lib/time'
import {
  computeTransitionProgress,
  easeInOutCubic,
} from '../../lib/easing'
import {
  useSolarSystemStore,
  TRANSITION_DURATION_MS,
} from '../../store/solarSystemStore'
import { Ring } from './Ring'

type PlanetProps = {
  data: PlanetData
  initialAngle: number
  /** base ScaleConfig. 매 프레임 mode/progress 로 *보간된 사본* 이 적용됨. */
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
 *   1. 공전 추가. groupRef position 매 프레임 갱신
 *   2. SECONDS_PER_REVOLUTION 상수 제거 → computeRotationAngle / computeOrbitAngle
 *   3. direction 변수 제거 — rotationPeriod_hours 부호가 결과 각도로 자연 전파
 *   4. += 누적 → = 절대 할당 (simulationDays 단일 진실)
 *   5. getEffectiveRotationPeriod 보정 — axial-flip 시 회전 방향 시각 일치
 *
 * ─── sub-phase 2-4 [Light 5] 변경 (거리 보간) ──────
 *   `distance` 가 useFrame *밖* 정적 계산 → useFrame *안* 동적 계산.
 *
 *   매 프레임 흐름:
 *     1. computeTransitionProgress(now, scaleModeChangedAt, 1500) → 0~1
 *     2. easeInOutCubic 적용 → S-curve eased
 *     3. getInterpolatedScaleConfig(base, mode, eased) → 그 순간의 ScaleConfig
 *     4. computeVisualDistance(data.realDistance_km, currentConfig) → 그 순간의 거리
 *
 *   *store 엔 progress 가 없다*. mode + changedAt 만으로 매 프레임 도출.
 *   sub-2-3 의 *증분→절대 시간* 패러다임을 *보간 상태* 로 확장한 결.
 *
 *   `radius` 는 정적 유지 — PRD §4 거리 토글은 *위치* 만 (크기 토글 없음).
 *   `effectiveRotationPeriod` 도 정적 — Light 6 에서 자전 보간 추가 예정.
 *
 *   ⚠️ OrbitPath 컴포넌트도 거리 토글 반응 필요 (시각 일관성).
 *      Light 5 시각 검증 후 별도 Light 로 처리.
 */
export function Planet({ data, initialAngle, scale }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)

  // ── 정적 (모드 무관) ──────────────────────────────
  const radius = computeVisualRadius(data.realRadius_km, scale)
  const AXIAL_TILT_RAD = (data.axialTilt_deg * Math.PI) / 180

  // axial tilt 90° 초과 행성 (금성 177.4°, 천왕성 97.77°) 의 좌표계 뒤집힘 보정
  const effectiveRotationPeriod = getEffectiveRotationPeriod(
    data.rotationPeriod_hours,
    data.axialTilt_deg,
  )

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return
    const {
      simulationDays,
      scaleMode,
      scaleModeChangedAt,
    } = useSolarSystemStore.getState()

    // ── 거리 보간 (sub-2-4 Light 5) ──────────────────
    const scaleProgress = easeInOutCubic(
      computeTransitionProgress(
        performance.now(),
        scaleModeChangedAt,
        TRANSITION_DURATION_MS,
      ),
    )
    const currentScaleConfig = getInterpolatedScaleConfig(
      scale,
      scaleMode,
      scaleProgress,
    )
    const distance = computeVisualDistance(
      data.realDistance_km,
      currentScaleConfig,
    )

    // ── 공전: xz 평면 원 궤도 ────────────────────────
    const orbitAngle = computeOrbitAngle(
      simulationDays,
      data.orbitalPeriod_days,
      initialAngle,
    )
    groupRef.current.position.x = Math.cos(orbitAngle) * distance
    groupRef.current.position.z = Math.sin(orbitAngle) * distance

    // ── 자전 (Light 6 에서 보간 추가 예정) ─────────────
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
