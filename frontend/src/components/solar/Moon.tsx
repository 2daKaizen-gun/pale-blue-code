import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { MoonData } from '../../data/planets'
import { type ScaleConfig, computeMoonVisualRadius } from '../../lib/scale'
import { getMoonLocalOffset } from '../../lib/bodyPosition'
import { useSolarSystemStore } from '../../store/solarSystemStore'
import { BodyLabel } from './BodyLabel'

type MoonProps = {
  data: MoonData
  /** 부모(지구) 실제 반지름 — 부모 상대 거리/크기 계산용. */
  parentRealRadius_km: number
  /** base ScaleConfig. 달은 radius 필드만 사용 (거리 토글 무관). */
  scale: ScaleConfig
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Moon — 지구의 위성. Planet 의 *외부 group(공전 위치)* 자식으로 마운트되어 지구를
 * 따라다니되, *자전축 group 밖* 이라 지구 자전/기울기 영향은 안 받는다.
 *
 * ─── 행성과 다른 점 ──────────────────────────────────
 *   1. 거리 기준이 *모행성(지구) 중심* → getMoonLocalOffset (부모 상대).
 *      거리 토글 영향 안 받음 — 부모 group 이 통째로 멀어지며 *같이 사라짐*.
 *   2. 자전이 *조석 고정* → 자전 토글 영향 안 받음. 자전을 공전각에 직접 묶음
 *      (rotation.y = -orbitAngle): 공전 한 바퀴당 한 바퀴 자전 → 한 면 고정 inward.
 *      조석 고정은 *교육적 거짓말이 아니라 실제 물리 사실* 이라 토글 대상 아님.
 *
 * ─── 카메라 추적과의 단일 source (sub-2-6 L7) ─────────
 *   여기 렌더 offset 과 CameraController 의 달 추적 위치가 *getMoonLocalOffset 한 함수*
 *   에서 나온다 → 카메라가 "달 옆 빈 공간" 을 가리킬 수 없음.
 *
 * ─── 호버/선택 (Planet 과 동일 두 단계) ───────────────
 *   호버 = 이름만, 선택(클릭) = 이름 + tagline. selectedBodyId === 'moon' 구독.
 */
export function Moon({ data, parentRealRadius_km, scale }: MoonProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = useSolarSystemStore((s) => s.selectedBodyId === 'moon')

  const radius = computeMoonVisualRadius(
    data.realRadius_km,
    parentRealRadius_km,
    scale,
  )

  // cursor — Planet 과 동일. unmount/leave 시 auto 복원.
  useEffect(() => {
    if (!isHovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [isHovered])

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return
    const { simulationDays } = useSolarSystemStore.getState()

    // 공전 offset (지구 local) — 카메라 추적과 같은 함수
    const offset = getMoonLocalOffset(
      data,
      parentRealRadius_km,
      simulationDays,
      scale,
    )
    groupRef.current.position.x = offset.x
    groupRef.current.position.z = offset.z

    // 조석 고정: 자전을 공전각에 묶음 (한 면 고정 inward)
    meshRef.current.rotation.y = -offset.orbitAngle
  })

  const showLabel = isHovered || isSelected
  const showTagline = isSelected

  return (
    <group ref={groupRef}>
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
          useSolarSystemStore.getState().selectBody('moon')
        }}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      {showLabel && (
        <BodyLabel
          name={data.name.en}
          tagline={showTagline ? data.taglineEn : undefined}
          radius={radius}
        />
      )}
    </group>
  )
}
