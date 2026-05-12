/**
 * 태양 데이터 — 별도 파일
 *
 * PLANETS 배열에 포함시키지 않는 이유:
 *  - 태양은 *행성이 아닌 별*. 분류상 다른 천체
 *  - realDistance 가 없음 (자기가 원점)
 *  - orbitalPeriod 가 없음 (태양 자신의 공전은 은하계 단위라 우리 범위 외)
 *  - PlanetData 타입에 optional 필드를 늘리는 대신 *다른 종류* 로 다룸
 *
 * 참고: NASA Sun Fact Sheet
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
 */

export type SunData = {
  name: { ko: string; en: string }

  // 실제 값
  realRadius_km: number
  rotationPeriod_hours: number    // 적도 기준 (태양은 위도에 따라 자전 속도 다름)
  surfaceTemperature_K: number    // 광구 온도 (참고용)

  // 시각 값 — R3F scene unit
  visualRadius: number

  // 자산
  texture: string
  description: string

  // 광원 설정
  lightIntensity: number          // <pointLight intensity>
  lightColor: string              // 광원 색상 (살짝 노란 흰색)
}

export const SUN: SunData = {
  name: { ko: '태양', en: 'Sun' },
  realRadius_km: 695_700,           // 지구의 약 109배
  rotationPeriod_hours: 609.12,     // 적도 기준 약 25.4일
  surfaceTemperature_K: 5778,
  visualRadius: 8.0,                // 실제 109배 → 시각 8배 (극단 압축)
  texture: '/textures/planets/sun.jpg',
  description:
    '태양계의 중심. 질량이 태양계 전체의 99.86% 를 차지한다. 8개 행성 + 모든 위성 + 모든 소행성 + 모든 혜성을 합쳐도 0.14%.',
  lightIntensity: 2.0,
  lightColor: '#fff5e1',            // 살짝 노란 흰색 — 태양은 *흰 별* 이지만 대기 산란으로 노랗게 보임
}
