/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * scale.ts — 비례 압축 함수.
 *
 * 공식:
 *   visualRadius   = (realRadius_km   / EARTH_RADIUS) ^ radiusExponent   × radiusScale
 *   visualDistance = (realDistance_km / ONE_AU)       ^ distanceExponent × distanceScale
 *
 * ─── sub-2-4 [Light 9.5] 갱신 ──────────────────────
 *   사용자 피드백: *real 모드에서 수성이 태양 안에 박힘*.
 *
 *   진단:
 *     real exp=1.0 + scale=20 → 수성 거리 0.387 × 20 = 7.74
 *     태양 radius (radiusExponent=0.5 유지) = 10.45 → 수성이 태양 *안*
 *
 *   해결:
 *     distanceScale 도 보간 대상에 포함 (visual=20, real=80).
 *     real 모드 수성 = 0.387 × 80 = 30.96 → 태양 밖 3배 거리.
 *     해왕성 = 30.05 × 80 = 2404 → *완전히 화면 밖* (PRD §3 *길 잃음* 정신).
 *
 *     radiusScale/radiusExponent 는 그대로 — radius 토글은 sub-2-4 범위 외.
 */

import { lerp } from './easing'

const EARTH_RADIUS_KM = 6_371
const ONE_AU_KM = 149_600_000

export type ScaleConfig = {
  radiusExponent: number
  radiusScale: number
  distanceExponent: number
  distanceScale: number
}

/**
 * 거리 토글 (sub-2-4) 의 두 모드.
 *   - 'visual': distanceExponent 0.5 + distanceScale 20. 한 화면 모임
 *   - 'real':   distanceExponent 1.0 + distanceScale 80. *지구가 점이 되고 해왕성은 화면 밖*
 */
export type ScaleMode = 'visual' | 'real'

const VISUAL_DISTANCE_EXPONENT = 0.5
const REAL_DISTANCE_EXPONENT = 1.0
const VISUAL_DISTANCE_SCALE = 20
const REAL_DISTANCE_SCALE = 80

export const DEFAULT_SCALE: ScaleConfig = {
  radiusExponent: 0.5,
  radiusScale: 1.0,
  distanceExponent: VISUAL_DISTANCE_EXPONENT,
  distanceScale: VISUAL_DISTANCE_SCALE,
}

export const computeVisualRadius = (
  realRadius_km: number,
  config: ScaleConfig,
): number => {
  const ratio = realRadius_km / EARTH_RADIUS_KM
  return Math.pow(ratio, config.radiusExponent) * config.radiusScale
}

export const computeVisualDistance = (
  realDistance_km: number,
  config: ScaleConfig,
): number => {
  const distanceAU = realDistance_km / ONE_AU_KM
  return Math.pow(distanceAU, config.distanceExponent) * config.distanceScale
}

/**
 * sub-2-4 거리 토글의 *보간된 ScaleConfig* 도출.
 *
 * exponent + scale *둘 다* 보간:
 *   visual: exp=0.5, scale=20  → 행성들 한 화면 모임
 *   real:   exp=1.0, scale=80  → 진짜 비례, 광활한 거리
 *
 * radiusExponent/radiusScale 은 baseConfig 그대로 (radius 토글 범위 외).
 *
 * @param baseConfig - DEFAULT_SCALE 등 기본 설정 (radius 관련 필드만 의미 있음)
 * @param mode - 도달 목표 모드
 * @param progress - eased 0~1 (호출 측에서 easeInOutCubic 적용 후 전달)
 * @returns distanceExponent + distanceScale 보간된 새 ScaleConfig
 */
export function getInterpolatedScaleConfig(
  baseConfig: ScaleConfig,
  mode: ScaleMode,
  progress: number,
): ScaleConfig {
  const fromExp =
    mode === 'real' ? VISUAL_DISTANCE_EXPONENT : REAL_DISTANCE_EXPONENT
  const toExp =
    mode === 'real' ? REAL_DISTANCE_EXPONENT : VISUAL_DISTANCE_EXPONENT
  const fromScale =
    mode === 'real' ? VISUAL_DISTANCE_SCALE : REAL_DISTANCE_SCALE
  const toScale =
    mode === 'real' ? REAL_DISTANCE_SCALE : VISUAL_DISTANCE_SCALE
  return {
    ...baseConfig,
    distanceExponent: lerp(fromExp, toExp, progress),
    distanceScale: lerp(fromScale, toScale, progress),
  }
}
