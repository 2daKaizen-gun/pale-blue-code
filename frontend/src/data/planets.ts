/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 태양계 행성 데이터.
 *
 * 시각 값은 lib/scale.ts 의 함수가 계산. data 는 real 값만 보관.
 *
 * 참고: NASA Planetary Fact Sheet
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 */

export type PlanetId =
  | 'mercury' | 'venus' | 'earth' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune'

/**
 * 고리 데이터 — 판별 합집합 (discriminated union).
 *   - texture: 토성처럼 풍부한 줄무늬가 있는 고리 (PNG with alpha)
 *   - solid: 천왕성처럼 단조로운 가는 띠 (단색 + 투명도)
 *
 * 컴포넌트 (Ring.tsx) 가 type 으로 분기. TypeScript 가 타입 좁히기 강제.
 */
export type RingData =
  | {
      type: 'texture'
      texture: string
      innerRadius_km: number
      outerRadius_km: number
    }
  | {
      type: 'solid'
      color: string
      opacity: number
      innerRadius_km: number
      outerRadius_km: number
    }

export type PlanetData = {
  id: PlanetId
  name: { ko: string; en: string }

  realRadius_km: number
  realDistance_km: number
  orbitalPeriod_days: number
  rotationPeriod_hours: number
  axialTilt_deg: number

  texture: string
  description: string

  ring?: RingData
}

export const PLANETS: readonly PlanetData[] = [
  {
    id: 'mercury',
    name: { ko: '수성', en: 'Mercury' },
    realRadius_km: 2_439.7,
    realDistance_km: 57_900_000,
    orbitalPeriod_days: 88,
    rotationPeriod_hours: 1407.6,
    axialTilt_deg: 0.034,
    texture: '/textures/planets/mercury.jpg',
    description:
      '태양에 가장 가까운 행성. 대기가 거의 없어 낮과 밤의 온도 차이가 600°C 에 달한다.',
  },
  {
    id: 'venus',
    name: { ko: '금성', en: 'Venus' },
    realRadius_km: 6_051.8,
    realDistance_km: 108_200_000,
    orbitalPeriod_days: 224.7,
    rotationPeriod_hours: -5832.5,
    axialTilt_deg: 177.4,
    texture: '/textures/planets/venus.jpg',
    description:
      '태양계에서 가장 뜨거운 행성 (표면 462°C). 두꺼운 황산 구름 때문에 표면을 가시광선으로 볼 수 없다.',
  },
  {
    id: 'earth',
    name: { ko: '지구', en: 'Earth' },
    realRadius_km: 6_371,
    realDistance_km: 149_600_000,
    orbitalPeriod_days: 365.25,
    rotationPeriod_hours: 23.93,
    axialTilt_deg: 23.5,
    texture: '/textures/planets/earth.jpg',
    description:
      '우리가 아는 한, 생명이 존재하는 유일한 곳. 보이저 1호가 60억 km 밖에서 찍었을 때 단 한 픽셀의 푸른 점이었다.',
  },
  {
    id: 'mars',
    name: { ko: '화성', en: 'Mars' },
    realRadius_km: 3_389.5,
    realDistance_km: 227_900_000,
    orbitalPeriod_days: 687,
    rotationPeriod_hours: 24.62,
    axialTilt_deg: 25.19,
    texture: '/textures/planets/mars.jpg',
    description:
      '*붉은 행성*. 표면의 산화철이 만든 색. 태양계 최대 화산 올림푸스 몬스 (높이 22km) 가 있다.',
  },
  {
    id: 'jupiter',
    name: { ko: '목성', en: 'Jupiter' },
    realRadius_km: 69_911,
    realDistance_km: 778_600_000,
    orbitalPeriod_days: 4_331,
    rotationPeriod_hours: 9.93,
    axialTilt_deg: 3.13,
    texture: '/textures/planets/jupiter.jpg',
    description:
      '태양계 최대 행성. 다른 7개 행성을 모두 합쳐도 목성의 절반에 못 미친다. 가스 행성이라 *표면* 이라는 개념이 없다.',
  },
  {
    id: 'saturn',
    name: { ko: '토성', en: 'Saturn' },
    realRadius_km: 58_232,
    realDistance_km: 1_433_500_000,
    orbitalPeriod_days: 10_747,
    rotationPeriod_hours: 10.66,
    axialTilt_deg: 26.73,
    texture: '/textures/planets/saturn.jpg',
    description:
      '고리의 행성. 고리는 99% 가 얼음 입자로, 두께가 평균 10m 에 불과하다. 토성의 밀도는 물보다 낮아 *거대한 욕조* 가 있으면 떠오른다.',
    ring: {
      type: 'texture',
      texture: '/textures/planets/saturn_ring.png',
      innerRadius_km: 74_500,       // 실제 (D ring 안쪽)
      outerRadius_km: 140_220,      // 실제 (A ring 바깥)
    },
  },
  {
    id: 'uranus',
    name: { ko: '천왕성', en: 'Uranus' },
    realRadius_km: 25_362,
    realDistance_km: 2_872_500_000,
    orbitalPeriod_days: 30_589,
    rotationPeriod_hours: -17.24,
    axialTilt_deg: 97.77,
    texture: '/textures/planets/uranus.jpg',
    description:
      '옆으로 누운 행성. 자전축이 98° 기울어져 사실상 *굴러가듯* 공전한다. 1977년 별 가림 관측으로 *어두운 13개 고리* 가 발견됨 — 토성에 이은 두 번째 고리 행성.',
    ring: {
      type: 'solid',
      color: '#9aa0a8',             // 어두운 회청색 — 얼음+탄소 잔해
      opacity: 0.35,
      innerRadius_km: 41_837,       // 6 ring (안쪽)
      outerRadius_km: 51_150,       // ε ring (가장 밝은 외곽 고리)
    },
  },
  {
    id: 'neptune',
    name: { ko: '해왕성', en: 'Neptune' },
    realRadius_km: 24_622,
    realDistance_km: 4_495_100_000,
    orbitalPeriod_days: 59_800,
    rotationPeriod_hours: 16.11,
    axialTilt_deg: 28.32,
    texture: '/textures/planets/neptune.jpg',
    description:
      '태양계의 끝. 1846년 *수학적 예측* 으로 발견된 최초의 행성 — 천왕성 궤도의 미세한 흔들림으로 *여기 뭔가 있다* 가 먼저 나왔다.',
  },
] as const

export const findPlanetById = (id: PlanetId): PlanetData | undefined =>
  PLANETS.find((p) => p.id === id)
