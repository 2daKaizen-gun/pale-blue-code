import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { RingData } from '../../data/planets'
import { computeVisualRadius, type ScaleConfig } from '../../lib/scale'
import { computeRotationAngle } from '../../lib/time'
import { useSolarSystemStore } from '../../store/solarSystemStore'

type RingProps = {
  data: RingData
  scale: ScaleConfig
  parentRotationPeriodHours: number // 부호가 결과 각도로 자연 전파
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Ring — 행성 고리 컴포넌트. 토성/천왕성 두 종류를 *판별 합집합* 으로 처리.
 *
 * ─── sub-phase 2-3 [Light 3] 변경 ──────────────────
 *   SECONDS_PER_REVOLUTION 상수 제거.
 *   rotationDirection prop 제거 → parentRotationPeriodHours 받음.
 *   부모 자전 주기 × RING_SPEED_FACTOR 로 *상대 속도* 결정.
 *   부호는 부모 주기에 이미 내재 (금성 -5832.5, 천왕성 -17.24).
 *
 *   현실은 *차등 회전* (내경 빠름, 외경 느림) 이지만 시각화는 *통합 회전*.
 *   행성보다 느린 속도가 *별개 천체* 임을 시각적으로 전달.
 *
 * ─── 좌표계 ─────────────────────────────────────────
 *   ringGeometry 는 xy 평면 → x축 90° 회전으로 xz 평면 (황도면).
 *   회전축은 *원래 ringGeometry 의 z* → 90° 회전 후엔 *y축* 같은 방향
 *   = 부모 행성 자전축 (중간 group 안에 있으니 자동).
 */

// 행성 자전 속도의 50%. 시각적 차별화 + 별개 천체 느낌
const RING_SPEED_FACTOR = 0.5

export function Ring({ data, scale, parentRotationPeriodHours }: RingProps) {
  if (data.type === 'texture') {
    return (
      <RingTextured
        data={data}
        scale={scale}
        parentRotationPeriodHours={parentRotationPeriodHours}
      />
    )
  }
  return (
    <RingSolid
      data={data}
      scale={scale}
      parentRotationPeriodHours={parentRotationPeriodHours}
    />
  )
}

// ─── 토성 같은 텍스처 고리 ──────────────────────────
function RingTextured({
  data,
  scale,
  parentRotationPeriodHours,
}: {
  data: Extract<RingData, { type: 'texture' }>
  scale: ScaleConfig
  parentRotationPeriodHours: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)
  const inner = computeVisualRadius(data.innerRadius_km, scale)
  const outer = computeVisualRadius(data.outerRadius_km, scale)

  useFrame(() => {
    if (!meshRef.current) return
    const { simulationDays } = useSolarSystemStore.getState()
    // rotation.z = ringGeometry 의 *원래 z축* 회전 = 90° 회전 후의 *고리 면 수직축* 회전
    meshRef.current.rotation.z =
      computeRotationAngle(simulationDays, parentRotationPeriodHours) *
      RING_SPEED_FACTOR
  })

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
  parentRotationPeriodHours,
}: {
  data: Extract<RingData, { type: 'solid' }>
  scale: ScaleConfig
  parentRotationPeriodHours: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const inner = computeVisualRadius(data.innerRadius_km, scale)
  const outer = computeVisualRadius(data.outerRadius_km, scale)

  useFrame(() => {
    if (!meshRef.current) return
    const { simulationDays } = useSolarSystemStore.getState()
    meshRef.current.rotation.z =
      computeRotationAngle(simulationDays, parentRotationPeriodHours) *
      RING_SPEED_FACTOR
  })

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
