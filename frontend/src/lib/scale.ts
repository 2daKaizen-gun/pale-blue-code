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
 *
 * ─── sub-2-4 보간 패러다임 ──────────────────────────
 *   store 에 *현재* exponent 를 저장하지 않음. mode + changedAt 만.
 *   매 프레임 컴포넌트가 progress 계산 → easeInOutCubic →
 *   getInterpolatedScaleConfig 로 *그 순간의 ScaleConfig* 도출.
 *   sub-2-3 의 *증분→절대 시간* 패러다임을 *보간 상태* 로 확장한 결.
 */

import { lerp } from './easing';

const EARTH_RADIUS_KM = 6_371;
const ONE_AU_KM = 149_600_000;

export type ScaleConfig = {
  radiusExponent: number;
  radiusScale: number;
  distanceExponent: number;
  distanceScale: number;
};

/**
 * 거리 토글 (sub-2-4) 의 두 모드.
 *   - 'visual': distanceExponent 0.5 (제곱근 압축). 화면 안 한꺼번에 모이는 시각 모드
 *   - 'real':   distanceExponent 1.0 (비례 그대로). *지구가 점이 되는 1초*
 */
export type ScaleMode = 'visual' | 'real';

const VISUAL_DISTANCE_EXPONENT = 0.5;
const REAL_DISTANCE_EXPONENT = 1.0;

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

/**
 * sub-2-4 거리 토글의 *보간된 ScaleConfig* 도출.
 *
 * 보간 모델:
 *   mode='real' 토글 직후 → 직전엔 visual 이었음. progress=0 시점에 0.5 (visual).
 *   progress=1 시점에 1.0 (real) 도달. 1.5초 동안 0.5 → 1.0 부드럽게.
 *   mode='visual' 토글은 정반대로 1.0 → 0.5.
 *
 *   *"mode 는 도달하려는 목표, progress 는 얼마나 갔는가"* 의 의미.
 *
 * 매 프레임 새 객체 생성 (8행성 × 60fps ≈ 480 obj/s) — 4필드 객체라 nursery GC,
 * 측정상 영향 0. *불변성* 보장이 *재계산 안전성* 보다 우선.
 *
 * @param baseConfig - DEFAULT_SCALE 등 기본 설정 (distanceExponent 제외 필드 그대로)
 * @param mode - 도달 목표 모드
 * @param progress - eased 0~1 (호출 측에서 easeInOutCubic 적용 후 전달)
 * @returns distanceExponent 만 보간된 새 ScaleConfig (불변, 새 객체)
 */
export function getInterpolatedScaleConfig(
  baseConfig: ScaleConfig,
  mode: ScaleMode,
  progress: number
): ScaleConfig {
  const fromExp =
    mode === 'real' ? VISUAL_DISTANCE_EXPONENT : REAL_DISTANCE_EXPONENT;
  const toExp =
    mode === 'real' ? REAL_DISTANCE_EXPONENT : VISUAL_DISTANCE_EXPONENT;
  return {
    ...baseConfig,
    distanceExponent: lerp(fromExp, toExp, progress),
  };
}
