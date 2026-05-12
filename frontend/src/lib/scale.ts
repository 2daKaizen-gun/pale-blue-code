/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * scale.ts — 비례 압축 함수.
 *
 * 공식:
 *   visualRadius   = (realRadius_km   / EARTH_RADIUS) ^ radiusExponent   × radiusScale
 *   visualDistance = (realDistance_km / ONE_AU)       ^ distanceExponent × distanceScale
 *
 * exponent:
 *   1.0 → 실제 비율 (sub-phase 2-4 실제 모드)
 *   0.5 → 제곱근 압축 (시각 모드 기본값)
 *   0   → 모두 같은 값
 */

const EARTH_RADIUS_KM = 6_371;
const ONE_AU_KM = 149_600_000;

export type ScaleConfig = {
  radiusExponent: number;
  radiusScale: number;
  distanceExponent: number;
  distanceScale: number;
};

/**
 * 시각 모드 기본값 — sub-phase 2-2 [Light 9] 손튜닝 결과.
 *
 * 계산 결과 미리보기 (참고):
 *   태양 반지름: (695_700 / 6_371) ^ 0.5 × 1.0 = 10.45
 *   수성 거리:   (0.387) ^ 0.5 × 20 = 12.44   → 태양 밖 (gap 약 2)
 *   해왕성 거리: (30.05) ^ 0.5 × 20 = 109.64  → maxDistance 200 안
 */
export const DEFAULT_SCALE: ScaleConfig = {
  radiusExponent: 0.5,
  radiusScale: 1.0,
  distanceExponent: 0.5,
  distanceScale: 20,
};

export const computeVisualRadius = (
  realRadius_km: number,
  config: ScaleConfig
): number => {
  const ratio = realRadius_km / EARTH_RADIUS_KM;
  return Math.pow(ratio, config.radiusExponent) * config.radiusScale;
};

export const computeVisualDistance = (
  realDistance_km: number,
  config: ScaleConfig
): number => {
  const distanceAU = realDistance_km / ONE_AU_KM;
  return Math.pow(distanceAU, config.distanceExponent) * config.distanceScale;
};
