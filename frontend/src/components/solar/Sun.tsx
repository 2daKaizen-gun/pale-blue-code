import { useEffect, useRef, useState } from 'react'
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
import { BodyLabel } from './BodyLabel'

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
 *   3. 자전축 기울기 없음 → axial-flip 보정 *생략*
 *   4. 거리 = 0 (자기가 원점) → 거리 토글 영향 없음, distance 보간 불필요
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   SECONDS_PER_REVOLUTION 상수 제거. simulationDays 기반 computeRotationAngle.
 *
 * ─── sub-phase 2-4 [Light 7] 변경 (자전 보간) ──────
 *   `SUN.rotationPeriod_hours` 정적 사용 → 매 프레임 보간된 period 적용.
 *
 *   태양 자전 주기: 25.38일 (적도 기준 609.12h).
 *   real 모드 토글 시 *태양도 5배 느려진다* — *모든 천체* 가 케플러 비례 따른다는 일관성.
 *
 *   실제 태양은 *위도마다 다른 차등 자전* 이지만 시각화는 단일 속도.
 *
 * ─── sub-phase 2-5 [Light 2] 변경 (인터랙션) ─────────
 *   Planet 과 같은 패턴: pointer 핸들러 3개 + isHovered + cursor effect.
 *   클릭 = `selectBody('sun')`. BodyId 합집합의 'sun' 변형.
 *
 *   특이점:
 *     - meshBasicMaterial 이라 emissive 호버 피드백 없음.
 *     - <pointLight> 는 group 의 자식 — pointer 이벤트 대상은 sphere mesh 만.
 *
 * ─── sub-phase 2-5 [Light 3/4] 변경 (호버/선택 라벨) ──
 *   BodyLabel 의 *두 단계* 표시 (Planet 과 동일 패턴):
 *     - 호버만 → 이름만
 *     - 선택됨 → 이름 + tagline
 *     - 둘 다 해제 → 라벨 없음
 *
 *   isSelected selector — `selectedBodyId === 'sun'` 으로 자기 선택 여부만 구독.
 */
export function Sun({ scale }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(SUN.texture)
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = useSolarSystemStore(
    (s) => s.selectedBodyId === 'sun',
  )

  const radius = computeVisualRadius(SUN.realRadius_km, scale)

  // Planet 과 동일 패턴 — Planet.tsx 주석 참조
  useEffect(() => {
    if (!isHovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [isHovered])

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

  const showLabel = isHovered || isSelected
  const showTagline = isSelected

  return (
    <group position={[0, 0, 0]}>
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
          useSolarSystemStore.getState().selectBody('sun')
        }}
      >
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <pointLight
        color={SUN.lightColor}
        intensity={SUN.lightIntensity}
        distance={0}
        decay={0}
      />
      {showLabel && (
        <BodyLabel
          name={SUN.name.en}
          tagline={showTagline ? SUN.taglineEn : undefined}
          radius={radius}
        />
      )}
    </group>
  )
}
