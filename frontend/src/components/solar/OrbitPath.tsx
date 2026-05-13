import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { computeVisualDistance, type ScaleConfig } from '../../lib/scale'

type OrbitPathProps = {
  realDistanceKm: number
  scale: ScaleConfig
  color?: string
  opacity?: number
  segments?: number
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * OrbitPath — 행성 공전 궤도를 xz 평면 (황도면) 의 *원* 으로 그림.
 *
 * ─── 원형 단순화 ───────────────────────────────────
 *   실제 궤도는 *타원* (이심률 있음). Phase 2 는 원형 가정 — TechSpec §5 *알려진 한계*.
 *   Phase 3 N-body 에서 정확한 케플러 타원으로 갈 예정.
 *
 * ─── 시각 디자인 ───────────────────────────────────
 *   기본 색: 어두운 회색 (#888) + opacity 0.2.
 *   *행성 자체* 가 주역이고 궤도는 *무대 표시* 같은 보조 역할.
 *   너무 강하면 시각적 노이즈, 너무 약하면 거리 토글 시 *흩어짐* 효과 약해짐.
 *
 * ─── 거리 토글과의 관계 (sub-2-4 예고) ──────────────
 *   scale 이 바뀌면 궤도 distance 도 자동으로 변함 (같은 함수 사용).
 *   → *실제 모드로 가는 1.5초* 동안 궤도 라인도 *행성과 함께* 바깥으로 흩어짐.
 *   행성이 점으로 사라질 때 *궤도만 광활한 원으로 남는* 시각적 충격.
 */

const DEFAULT_COLOR = '#888888'
const DEFAULT_OPACITY = 0.2
const DEFAULT_SEGMENTS = 128

export function OrbitPath({
  realDistanceKm,
  scale,
  color = DEFAULT_COLOR,
  opacity = DEFAULT_OPACITY,
  segments = DEFAULT_SEGMENTS,
}: OrbitPathProps) {
  const distance = computeVisualDistance(realDistanceKm, scale)

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      pts.push(
        new THREE.Vector3(
          Math.cos(theta) * distance,
          0,
          Math.sin(theta) * distance,
        ),
      )
    }
    return pts
  }, [distance, segments])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
    />
  )
}
