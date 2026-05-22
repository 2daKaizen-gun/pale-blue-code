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

/**
 * 달 offset (부모 반지름 기준) — exponent 압축 + scale.
 *
 * ⚠️ 시각 모드에선 행성들이 빽빽하다 (지구↔금성 간격 ≈ 2.99, 지구 반지름 1.0).
 * 달 궤도가 이 간격보다 크면 금성/화성과 *충돌* → SCALE 을 작게 잡아 궤도 ≈ 1.48
 * (금성 간격 안에 안전히 들어감). bug fix (sub-2-6): 3.9 → 1.48. 회귀 테스트로 고정.
 */
const MOON_DISTANCE_EXPONENT = 0.5
const MOON_DISTANCE_SCALE = 0.19

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
 * 달(위성)의 *부모 행성 중심 기준* 시각 거리.
 *
 * 행성 거리(computeVisualDistance)는 *태양 기준* (ONE_AU) 이라 달의 실제 거리
 * 384,400km 를 그대로 넣으면 지구 반지름 수준 값이 나와 *지구에 박힘*.
 * 그래서 달은 *부모(지구) 반지름 대비 비율* 로 따로 계산한다.
 *
 * 실제 비: 384,400 / 6,371 ≈ 60.3배. 그대로 그리면 별개 행성처럼 멀어지므로
 * exponent 로 압축 (행성 거리 압축과 같은 결). 기본값 → 약 1.48× 부모 반지름
 * — 시각 모드 행성 간격(~3) 안에 들어가게. 실제 60배 → 시각 1.48배의 큰 거짓말.
 *
 *   visualMoonDistance = parentVisualRadius
 *                      × (moonRealDistance / parentRealRadius) ^ MOON_DISTANCE_EXPONENT
 *                      × MOON_DISTANCE_SCALE
 *
 * 거리 토글(distance)의 영향은 *받지 않는다* — 부모 반지름 기준이라 모드 무관 일정.
 * 거리 토글 시 "지구가 점이 되며 달도 같이 사라짐" 은 부모 group 이 통째로
 * 멀어지면서 (computeVisualDistance) 자연 발생.
 *
 * @param moonRealDistance_km - 달~부모 중심 실제 거리
 * @param parentRealRadius_km - 부모 행성 실제 반지름 (지구 6,371)
 * @param config - radiusScale/Exponent 만 사용 (부모 시각 반지름 계산용)
 */
export const computeMoonVisualDistance = (
  moonRealDistance_km: number,
  parentRealRadius_km: number,
  config: ScaleConfig,
): number => {
  const parentVisualRadius = computeVisualRadius(parentRealRadius_km, config)
  const ratio = moonRealDistance_km / parentRealRadius_km
  return (
    parentVisualRadius *
    Math.pow(ratio, MOON_DISTANCE_EXPONENT) *
    MOON_DISTANCE_SCALE
  )
}

/**
 * 달(위성)의 *부모 상대* 시각 반지름.
 *
 * 행성은 computeVisualRadius 의 sqrt(exponent 0.5) 로 *부풀려* 그린다 — 태양까지의
 * 광활한 거리 척도 옆에서 안 보이면 곤란하니까. 그런데 달은 *부모(지구) 바로 옆*
 * 근접 척도에서 보이므로 부풀릴 필요가 없다 → *선형 실제 비율* (지구의 0.273배)
 * 그대로. 이래야 빽빽한 시각 모드에서 금성과 충돌하지 않을 만큼 작게 들어간다.
 *
 *   visualMoonRadius = parentVisualRadius × (moonRealRadius / parentRealRadius)
 */
export const computeMoonVisualRadius = (
  moonRealRadius_km: number,
  parentRealRadius_km: number,
  config: ScaleConfig,
): number => {
  const parentVisualRadius = computeVisualRadius(parentRealRadius_km, config)
  return parentVisualRadius * (moonRealRadius_km / parentRealRadius_km)
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
