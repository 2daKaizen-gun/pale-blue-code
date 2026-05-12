/**
 * 태양계 행성 데이터 — 단일 소스 (Single Source of Truth)
 *
 * 두 종류의 값을 한 객체에 보관:
 *  - real*: NASA Planetary Fact Sheet 의 실제 값. 단위 명시 필수.
 *  - visual*: R3F scene unit. 손튜닝으로 정한 *교육적 거짓말*.
 *
 * 거리 토글 (sub-phase 2-4) 이 들어오면:
 *   displayDistance = (mode === 'real')
 *     ? realDistance_km / SCALE_FACTOR
 *     : visualDistance
 *
 * 참고: NASA Planetary Fact Sheet
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 */

export type PlanetId =
  | 'mercury' | 'venus' | 'earth' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune'

export type PlanetData = {
  id: PlanetId
  name: { ko: string; en: string }

  // 실제 값 (NASA, km / days / hours)
  realRadius_km: number
  realDistance_km: number       // 평균 궤도 반경 (태양 중심)
  orbitalPeriod_days: number    // 공전 주기
  rotationPeriod_hours: number  // 자전 주기 (음수 = 역회전)
  axialTilt_deg: number         // 자전축 기울기

  // 시각 값 (R3F scene unit) — 손튜닝 영역
  visualRadius: number
  visualDistance: number

  // 자산
  texture: string               // public/textures/planets/{id}.jpg
  description: string           // 정보 패널용 (sub-phase 2-5)

  // 토성 전용 — 고리
  ring?: {
    texture: string
    innerRadius: number         // visualRadius 의 배수
    outerRadius: number
  }
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
    visualRadius: 0.5,
    visualDistance: 8,
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
    rotationPeriod_hours: -5832.5,    // 역회전 (음수)
    axialTilt_deg: 177.4,             // 거의 뒤집힘 — 역회전의 다른 표현
    visualRadius: 0.95,
    visualDistance: 11,
    texture: '/textures/planets/venus.jpg',
    description:
      '태양계에서 가장 뜨거운 행성 (표면 462°C). 두꺼운 황산 구름 때문에 표면을 가시광선으로 볼 수 없다.',
  },
  {
    id: 'earth',
    name: { ko: '지구', en: 'Earth' },
    realRadius_km: 6_371,
    realDistance_km: 149_600_000,     // 1 AU 의 정의
    orbitalPeriod_days: 365.25,
    rotationPeriod_hours: 23.93,
    axialTilt_deg: 23.5,              // sub-phase 2-1 의 그 23.5°
    visualRadius: 1.0,                // 기준값
    visualDistance: 15,
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
    rotationPeriod_hours: 24.62,      // 지구와 거의 같은 *화성일* (sol)
    axialTilt_deg: 25.19,
    visualRadius: 0.7,
    visualDistance: 20,
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
    rotationPeriod_hours: 9.93,       // 가장 빠른 자전
    axialTilt_deg: 3.13,
    visualRadius: 3.5,                // 실제 11.2배 → 시각 3.5 (압축)
    visualDistance: 30,
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
    visualRadius: 3.0,
    visualDistance: 38,
    texture: '/textures/planets/saturn.jpg',
    description:
      '고리의 행성. 고리는 99% 가 얼음 입자로, 두께가 평균 10m 에 불과하다. 토성의 밀도는 물보다 낮아 *거대한 욕조* 가 있으면 떠오른다.',
    ring: {
      texture: '/textures/planets/saturn_ring.png',
      innerRadius: 1.3,               // visualRadius 의 1.3배 = 3.9 unit
      outerRadius: 2.3,               // visualRadius 의 2.3배 = 6.9 unit
    },
  },
  {
    id: 'uranus',
    name: { ko: '천왕성', en: 'Uranus' },
    realRadius_km: 25_362,
    realDistance_km: 2_872_500_000,
    orbitalPeriod_days: 30_589,
    rotationPeriod_hours: -17.24,     // 역회전
    axialTilt_deg: 97.77,             // 거의 옆으로 누워 자전 — 태양계의 이단아
    visualRadius: 1.8,
    visualDistance: 44,
    texture: '/textures/planets/uranus.jpg',
    description:
      '옆으로 누운 행성. 자전축이 98° 기울어져 사실상 *굴러가듯* 공전한다. 과거 대규모 충돌의 흔적으로 추정.',
  },
  {
    id: 'neptune',
    name: { ko: '해왕성', en: 'Neptune' },
    realRadius_km: 24_622,
    realDistance_km: 4_495_100_000,
    orbitalPeriod_days: 59_800,       // 165년
    rotationPeriod_hours: 16.11,
    axialTilt_deg: 28.32,
    visualRadius: 1.75,
    visualDistance: 50,
    texture: '/textures/planets/neptune.jpg',
    description:
      '태양계의 끝. 1846년 *수학적 예측* 으로 발견된 최초의 행성 — 천왕성 궤도의 미세한 흔들림으로 *여기 뭔가 있다* 가 먼저 나왔다.',
  },
] as const

/**
 * id 로 행성 찾기 (sub-phase 2-5 의 행성 클릭 등에서 사용 예정)
 */
export const findPlanetById = (id: PlanetId): PlanetData | undefined =>
  PLANETS.find((p) => p.id === id)
