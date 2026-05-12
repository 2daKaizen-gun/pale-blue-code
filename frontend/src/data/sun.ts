/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 태양 데이터 — *real 값만* 보관 (sub-2-2 [Light 6] 비례 압축 도입 후).
 *
 * PLANETS 배열에 포함시키지 않는 이유:
 *   - 태양은 *행성이 아닌 별*. 분류상 다른 천체
 *   - realDistance 가 없음 (자기가 원점)
 *   - orbitalPeriod 가 없음 (태양 자신의 공전은 은하계 단위라 우리 범위 외)
 *
 * 참고: NASA Sun Fact Sheet
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
 */

export type SunData = {
  name: { ko: string; en: string }

  // 실제 값
  realRadius_km: number             // 지구의 약 109배 — 시각 압축 후에도 가장 큰 천체
  rotationPeriod_hours: number      // 적도 기준 (위도마다 다른 *차등 회전*)
  surfaceTemperature_K: number      // 광구 온도 (참고용)

  // 자산
  texture: string
  description: string

  // 광원 설정
  lightIntensity: number
  lightColor: string
}

export const SUN: SunData = {
  name: { ko: '태양', en: 'Sun' },
  realRadius_km: 695_700,
  rotationPeriod_hours: 609.12,
  surfaceTemperature_K: 5778,
  texture: '/textures/planets/sun.jpg',
  description:
    '태양계의 중심. 질량이 태양계 전체의 99.86% 를 차지한다. 8개 행성 + 모든 위성 + 모든 소행성 + 모든 혜성을 합쳐도 0.14%.',
  lightIntensity: 2.0,
  lightColor: '#fff5e1',
}
