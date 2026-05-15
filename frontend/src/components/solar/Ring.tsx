import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { RingData } from '../../data/planets'
import { computeVisualRadius, type ScaleConfig } from '../../lib/scale'
import {
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

/** 부모 행성 데이터 중 *자전 보간에 필요한 두 필드* 만. */
type ParentRotation = {
  rotationPeriod_hours: number
  axialTilt_deg: number
}

type RingProps = {
  data: RingData
  scale: ScaleConfig
  parent: ParentRotation
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Ring — 행성 고리 컴포넌트. 토성/천왕성 두 종류를 *판별 합집합* 으로 처리.
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   parentRotationPeriodHours 단일 number prop 받음. RING_SPEED_FACTOR=0.5 상대.
 *
 * ─── sub-phase 2-4 [Light 6c] 변경 ──────────────────
 *   prop 시그니처: `parentRotationPeriodHours: number` → `parent: { rotationPeriod_hours, axialTilt_deg }`.
 *
 *   왜:
 *     Planet 의 effectiveRotationPeriod 가 *매 프레임 보간된 동적값* 으로 변함.
 *     이걸 prop 으로 매 프레임 전달하면 Ring 매 프레임 re-render. 부담.
 *
 *   해결:
 *     parent 는 *정적* data (rotationPeriod_hours, axialTilt_deg 두 NASA 값).
 *     Ring 이 *자체로 store 구독* 해 자전 보간 적용 — Planet 의 보간과 *완전 동기*
 *     (같은 store, 같은 함수, 같은 progress).
 *
 *     매 프레임 prop 변경 0, Ring re-render 0.
 *
 * ─── 좌표계 ─────────────────────────────────────────
 *   ringGeometry 는 xy 평면 → x축 90° 회전으로 xz 평면 (황도면).
 *   회전축은 *원래 ringGeometry 의 z* → 90° 회전 후엔 *y축 같은 방향*
 *   = 부모 행성 자전축 (중간 group 안에 있으니 자동).
 */

// 행성 자전 속도의 50%. 시각적 차별화 + 별개 천체 느낌
const RING_SPEED_FACTOR = 0.5

/**
 * 자전 보간된 회전을 mesh.rotation.z 에 매 프레임 적용.
 * RingTextured/RingSolid 공용 — Planet 의 useFrame 자전 블록과 *완전 동일* 흐름.
 */
function useRingRotation(
  meshRef: RefObject<THREE.Mesh>,
  parent: ParentRotation,
) {
  useFrame(() => {
    if (!meshRef.current) return
    const {
      simulationDays,
      rotationMode,
      rotationModeChangedAt,
    } = useSolarSystemStore.getState()

    const progress = easeInOutCubic(
      computeTransitionProgress(
        performance.now(),
        rotationModeChangedAt,
        TRANSITION_DURATION_MS,
      ),
    )
    const interpolated = getInterpolatedRotationPeriod(
      parent.rotationPeriod_hours,
      rotationMode,
      progress,
    )
    const effective = getEffectiveRotationPeriod(
      interpolated,
      parent.axialTilt_deg,
    )
    // rotation.z = ringGeometry 의 원래 z축 (90° 회전 후 고리 면 수직축)
    meshRef.current.rotation.z =
      computeRotationAngle(simulationDays, effective) * RING_SPEED_FACTOR
  })
}

export function Ring({ data, scale, parent }: RingProps) {
  if (data.type === 'texture') {
    return <RingTextured data={data} scale={scale} parent={parent} />
  }
  return <RingSolid data={data} scale={scale} parent={parent} />
}

// ─── 토성 같은 텍스처 고리 ──────────────────────────
function RingTextured({
  data,
  scale,
  parent,
}: {
  data: Extract<RingData, { type: 'texture' }>
  scale: ScaleConfig
  parent: ParentRotation
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)
  const inner = computeVisualRadius(data.innerRadius_km, scale)
  const outer = computeVisualRadius(data.outerRadius_km, scale)

  useRingRotation(meshRef, parent)

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 64]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── 천왕성 같은 단색 고리 ──────────────────────────
function RingSolid({
  data,
  scale,
  parent,
}: {
  data: Extract<RingData, { type: 'solid' }>
  scale: ScaleConfig
  parent: ParentRotation
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const inner = computeVisualRadius(data.innerRadius_km, scale)
  const outer = computeVisualRadius(data.outerRadius_km, scale)

  useRingRotation(meshRef, parent)

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 64]} />
      <meshBasicMaterial
        color={data.color}
        transparent
        opacity={data.opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
