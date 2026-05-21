import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { MoonData } from '../../data/planets'
import {
  type ScaleConfig,
  computeVisualRadius,
  computeMoonVisualDistance,
} from '../../lib/scale'
import { computeOrbitAngle } from '../../lib/time'
import { useSolarSystemStore } from '../../store/solarSystemStore'

type MoonProps = {
  data: MoonData
  /** 부모(지구) 실제 반지름 — 부모 상대 거리 계산용. */
  parentRealRadius_km: number
  /** base ScaleConfig. 달은 radius 필드만 사용 (거리 토글 무관). */
  scale: ScaleConfig
}

/** 달 공전 시작 각도 — 지구 기준 임의 위상 (한 점에 박혀 시작 안 하게). */
const MOON_INITIAL_ANGLE = Math.PI / 4

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Moon — 지구의 위성. Planet 의 *외부 group(공전 위치)* 자식으로 마운트되어
 * 지구를 따라다니되, *자전축 group 밖* 이라 지구 자전/기울기 영향은 안 받는다.
 *
 * ─── 행성과 다른 두 가지 ─────────────────────────────
 *   1. 거리 기준이 *모행성(지구) 중심* → computeMoonVisualDistance (부모 상대 스케일).
 *      거리 토글의 영향 안 받음 — 부모 group 이 통째로 멀어지며 *같이 사라짐*.
 *   2. 자전이 *조석 고정(tidal lock)* → 자전 토글 영향 안 받음 (아래 참조).
 *
 * ─── 조석 고정 (tidal lock) ──────────────────────────
 *   달은 자전 주기 = 공전 주기 (둘 다 27.32일) → 늘 같은 면이 지구를 향한다.
 *   그래서 자전을 *공전각에 직접 묶는다* (rotation.y = -orbitAngle): 공전 한 바퀴당
 *   정확히 한 바퀴 자전 → 한 면 고정 inward.
 *
 *   *왜 자전 토글(rotationMode)을 안 쓰나*: 토글은 자전 *속도 차이* (수성 느림/목성
 *   빠름) 를 보여주는 *교육적 거짓말 ↔ 진실* 장치다. 그런데 조석 고정은 *교육적
 *   거짓말이 아니라 실제 물리 사실*. 토글로 visual 모드에서 자전을 압축하면 lock 이
 *   깨져 달이 제멋대로 돌아버린다. 그래서 달은 *항상 lock* — 토글과 무관하게.
 */
export function Moon({ data, parentRealRadius_km, scale }: MoonProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(data.texture)
  const radius = computeVisualRadius(data.realRadius_km, scale)

  useFrame(() => {
    if (!meshRef.current) return
    const { simulationDays } = useSolarSystemStore.getState()

    // ── 공전: 지구(원점) 기준 xz 원 궤도 ──
    const distance = computeMoonVisualDistance(
      data.realDistance_km,
      parentRealRadius_km,
      scale,
    )
    const orbitAngle = computeOrbitAngle(
      simulationDays,
      data.orbitalPeriod_days,
      MOON_INITIAL_ANGLE,
    )
    meshRef.current.position.x = Math.cos(orbitAngle) * distance
    meshRef.current.position.z = Math.sin(orbitAngle) * distance

    // ── 조석 고정: 자전을 공전각에 묶음 (공전당 1회전 → 한 면 고정) ──
    meshRef.current.rotation.y = -orbitAngle
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}
