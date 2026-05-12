/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * scale.ts — 비례 압축 함수.
 *
 * 동기:
 *   진짜 비율로 그리면 행성이 안 보이고, 손튜닝으로는 *왜 그 값인가* 의
 *   답이 없다. 그 사이의 길이 *비례 압축* — 실제 비율을 유지하되 지수로 압축.
 *
 *   비유: 음악의 옥타브가 *주파수의 지수* 를 *균등 간격* 으로 보이게 만든 것.
 *
 * 공식:
 *   visualRadius   = (realRadius_km   / EARTH_RADIUS) ^ radiusExponent   × radiusScale
 *   visualDistance = (realDistance_km / ONE_AU)       ^ distanceExponent × distanceScale
 *
 * exponent 의 의미:
 *   1.0 → 실제 비율 그대로 (sub-phase 2-4 의 *실제 모드*)
 *   0.5 → 제곱근 압축 (sub-phase 2-2 의 *시각 모드* 기본값)
 *   0   → 모두 같은 값 (극단, 디버그용)
 *
 * 단일 소스 패턴:
 *   - data/planets.ts 와 data/sun.ts 는 *real 값만* 보관
 *   - 컴포넌트는 *항상 이 함수만 거쳐* visual 값 획득
 *   - 단위 변환 (km → AU) 도 *함수 내부에만* — 외부 코드는 km 만 다룸
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
 * 시각 모드 기본값.
 * sub-phase 2-2 [Light 9] 의 손튜닝으로 확정 예정.
 * sub-phase 2-4 의 거리 토글이 *실제 모드* 일 때는 exponent 가 1.0 으로 이동.
 */
export const DEFAULT_SCALE: ScaleConfig = {
  radiusExponent: 0.5,
  radiusScale: 1.0,
  distanceExponent: 0.5,
  distanceScale: 14,
};

/**
 * 실제 반지름 (km) → 시각 반지름 (R3F scene unit).
 * 지구가 기준 (지구 반지름 1.0 일 때 radiusScale 도 1.0 이면 visualRadius = 1.0).
 */
export const computeVisualRadius = (
  realRadius_km: number,
  config: ScaleConfig
): number => {
  const ratio = realRadius_km / EARTH_RADIUS_KM;
  return Math.pow(ratio, config.radiusExponent) * config.radiusScale;
};

/**
 * 실제 궤도 반경 (km) → 시각 거리 (R3F scene unit, 태양 중심부터).
 * 지구가 기준 (1 AU 일 때 distanceScale 만큼).
 */
export const computeVisualDistance = (
  realDistance_km: number,
  config: ScaleConfig
): number => {
  const distanceAU = realDistance_km / ONE_AU_KM;
  return Math.pow(distanceAU, config.distanceExponent) * config.distanceScale;
};
