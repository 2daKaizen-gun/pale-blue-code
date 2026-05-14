import { Stars } from '@react-three/drei'

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * Starfield — sphere 형태로 분포된 별 배경.
 *
 * ─── 천문학적 정직함 vs 시각화 ──────────────────────
 *   진짜 우주는 *시각적으로 거의 검정* — 별들이 너무 멀어서 우리 눈으론 *대부분 빈 공간*.
 *   망원경 / 장노출 사진으로만 *별이 빽빽한 진실* 이 드러남 (Hubble Deep Field).
 *
 *   우리 시뮬레이션은 *행성 거리를 압축* 했으니 *별 거리도 비례 압축* 한 셈.
 *   *교육적 거짓말의 한 차원* — PRD §3 의 일관된 트레이드오프.
 *
 * ─── 파라미터 ──────────────────────────────────────
 *   radius=300     OrbitControls.maxDistance 와 매치. 카메라가 가는 끝까지 별이 있음.
 *   depth=60       sphere 두께 — *공간감* 위한 3D 분포 (얇은 shell 아님).
 *   count=5000     적당히 빽빽, perf 안전.
 *   saturation=0   순백색. 실제 별들은 온도별로 다양 (붉은=차가움, 푸른=뜨거움) 이지만,
 *                  행성 텍스처와 *시각적 경쟁 안 하게* 순백.
 *   fade           멀리 있는 별 fade out → 깊이감 향상.
 *   speed=1        미세한 깜박임/회전 → *살아있는 우주* 느낌.
 *
 * ─── sub-phase 위치 ─────────────────────────────────
 *   원래 sub-2-6 배정이었지만, drei <Stars> 가 한 줄이라 sub-2-3 [Light 8] 로 당겨옴.
 *   sub-2-6 책임은 *달 + ControlPanel UI 마무리* 만으로 가벼워짐.
 */

const RADIUS = 300
const DEPTH = 60
const COUNT = 5000
const FACTOR = 4
const SATURATION = 0
const SPEED = 1

export function Starfield() {
  return (
    <Stars
      radius={RADIUS}
      depth={DEPTH}
      count={COUNT}
      factor={FACTOR}
      saturation={SATURATION}
      fade
      speed={SPEED}
    />
  )
}
