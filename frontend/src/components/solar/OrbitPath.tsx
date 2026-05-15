import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  computeVisualDistance,
  getInterpolatedScaleConfig,
  type ScaleConfig,
} from '../../lib/scale'
import {
  computeTransitionProgress,
  easeInOutCubic,
} from '../../lib/easing'
import {
  useSolarSystemStore,
  TRANSITION_DURATION_MS,
} from '../../store/solarSystemStore'

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
 * ─── sub-phase 2-4 [Light 5.5] 거리 토글 합류 ───────
 *   기존: distance 정적 계산 → useMemo 가 128 Vector3 한 번 생성.
 *   문제: 거리 토글 시 distance 가 매 프레임 변해야 하는데 useMemo 캐시 영구.
 *
 *   해결 — **mesh.scale 트릭**:
 *     1. useMemo 가 *단위 원* (반지름 1) 을 한 번만 생성 — geometry 재계산 0
 *     2. <group> 으로 <Line> 을 감싸고, group.scale 매 프레임 갱신
 *     3. 자식 mesh 의 vertex 는 그대로, GPU transform 단계에서만 distance 곱셈
 *
 *   매 프레임 객체 생성 0, GPU 부담 0. *Three.js 의 결을 그대로 활용*.
 *
 *   → *실제 모드로 가는 1.5초* 동안 궤도 라인이 *행성과 함께* 바깥으로 흩어진다.
 *      행성이 점으로 사라질 때 *궤도만 광활한 원으로 남는* 시각적 충격.
 *      PRD §3 의 영혼이 *예약대로* 작동.
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
  const groupRef = useRef<THREE.Group>(null)

  // 단위 원 (반지름 1). geometry 한 번만 생성, 매 프레임 재사용.
  const unitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)))
    }
    return pts
  }, [segments])

  useFrame(() => {
    if (!groupRef.current) return
    const { scaleMode, scaleModeChangedAt } = useSolarSystemStore.getState()

    // ── 거리 보간 — Planet 과 *완전히 동일한 흐름* (동시 보간 보장) ──
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
    const distance = computeVisualDistance(realDistanceKm, currentScaleConfig)

    // group 의 scale 곱셈 → 자식 Line 의 단위 원 vertex 들이 자동 확대
    groupRef.current.scale.setScalar(distance)
  })

  return (
    <group ref={groupRef}>
      <Line
        points={unitPoints}
        color={color}
        lineWidth={1}
        transparent
        opacity={opacity}
      />
    </group>
  )
}
