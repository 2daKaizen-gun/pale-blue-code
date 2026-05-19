import { useEffect, useRef, useState } from 'react'
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
import { Ring } from './Ring'
import { BodyLabel } from './BodyLabel'

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
 *       [Ring] 자전축 기울기는 받고, 자체 store 구독으로 독립 회전
 *     [BodyLabel] isHovered 시만 (sub-2-5 [Light 3]) — 자전축 group *밖* 자식
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   1. 공전 추가. 2. += → = 절대 할당. 3. direction 변수 제거.
 *   4. getEffectiveRotationPeriod axial-flip 보정.
 *
 * ─── sub-phase 2-4 [Light 5/6b] 변경 (보간) ──────────
 *   distance/effectiveRotationPeriod *정적 계산* → useFrame *동적 계산*.
 *
 *   매 프레임 두 보간이 *독립적으로* 흐른다 (서로 다른 changedAt):
 *     거리: scaleMode + scaleModeChangedAt → exp 0.5↔1.0 lerp
 *     자전: rotationMode + rotationModeChangedAt → period visual↔real lerp
 *   *전체 진실 프리셋* 은 두 changedAt 동기화로 동시 보간 자동 보장.
 *
 *   Ring 에는 *정적 parent 객체* (data 의 두 필드) 만 전달. Ring 이 자체로
 *   store 구독해 자전 보간 — 매 프레임 prop 변경 0, re-render 0.
 *   `radius` 와 AXIAL_TILT_RAD 는 정적 유지 — radius 토글은 sub-2-4 범위 외.
 *
 * ─── sub-phase 2-5 [Light 2] 변경 (인터랙션) ─────────
 *   pointer 핸들러 3개 (over/out/click) 를 mesh 에 부착. 태양도 같은 패턴 (Sun.tsx).
 *
 *   - **isHovered 는 로컬 state**: 호버는 *행성 자기 일*.
 *   - **e.stopPropagation()**: 작은 행성 클릭 시 뒤 큰 행성도 같이 hit 차단.
 *   - **cursor 변경은 useEffect 단일 책임**: unmount 시 stuck 자동 방어.
 *   - **클릭 = store.selectBody(data.id)**: PlanetId 가 BodyId 합집합의 부분.
 *
 * ─── sub-phase 2-5 [Light 3/4] 변경 (호버 라벨) ───────
 *   BodyLabel 을 *외부 group 의 자식* 으로 추가. conditional render (isHovered).
 *   [Light 3]: 영어 이름 (`data.name.en`)
 *   [Light 4]: 영어 한 줄 시그니처 (`data.taglineEn`) 도 함께 전달
 */
export function Planet({ data, initialAngle, scale }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)
  const [isHovered, setIsHovered] = useState(false)

  const radius = computeVisualRadius(data.realRadius_km, scale)
  const AXIAL_TILT_RAD = (data.axialTilt_deg * Math.PI) / 180

  // Ring 에 넘길 정적 parent 객체 — Ring 이 자체로 store 구독해 자전 보간 적용
  const ringParent = {
    rotationPeriod_hours: data.rotationPeriod_hours,
    axialTilt_deg: data.axialTilt_deg,
  }

  // cursor 변경의 단일 책임. isHovered=true 진입 시 pointer, 떠날 때 (false 변화
  // 또는 unmount) cleanup 으로 auto 복원. 페이지 이동 시 stuck 자동 방어.
  useEffect(() => {
    if (!isHovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [isHovered])

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return
    const {
      simulationDays,
      scaleMode,
      scaleModeChangedAt,
      rotationMode,
      rotationModeChangedAt,
    } = useSolarSystemStore.getState()
    const now = performance.now()

    // ── 거리 보간 (Light 5) ──────────────────────────
    const scaleProgress = easeInOutCubic(
      computeTransitionProgress(now, scaleModeChangedAt, TRANSITION_DURATION_MS),
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

    // ── 자전 보간 (Light 6b) ─────────────────────────
    // 합성: real → interpolated → effective → angle
    const rotationProgress = easeInOutCubic(
      computeTransitionProgress(
        now,
        rotationModeChangedAt,
        TRANSITION_DURATION_MS,
      ),
    )
    const interpolatedPeriod = getInterpolatedRotationPeriod(
      data.rotationPeriod_hours,
      rotationMode,
      rotationProgress,
    )
    const effectiveRotationPeriod = getEffectiveRotationPeriod(
      interpolatedPeriod,
      data.axialTilt_deg,
    )
    meshRef.current.rotation.y = computeRotationAngle(
      simulationDays,
      effectiveRotationPeriod,
    )
  })

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation()
            setIsHovered(true)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setIsHovered(false)
          }}
          onClick={(e) => {
            e.stopPropagation()
            useSolarSystemStore.getState().selectBody(data.id)
          }}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial map={texture} />
        </mesh>
        {data.ring && (
          <Ring data={data.ring} scale={scale} parent={ringParent} />
        )}
      </group>
      {isHovered && (
        <BodyLabel
          name={data.name.en}
          tagline={data.taglineEn}
          radius={radius}
        />
      )}
    </group>
  )
}
