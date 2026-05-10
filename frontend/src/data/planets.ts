/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * 행성 데이터의 단일 소스 (Single Source of Truth).
 * Scene, ControlPanel, InfoPanel 등 모든 곳이 이 파일을 import 한다.
 *
 * - 실제 값 (real*): NASA Planetary Fact Sheet 기준, 단위 그대로
 *   https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 * - 시각 값 (visual*): R3F scene unit, 가독성을 위해 손으로 깎은 값
 *
 * 두 값을 모두 보관하는 이유 — 거리 스케일 토글이 두 모드를 자유롭게 오감.
 * `displayDistance = (mode === 'real') ? realDistance_km / SCALE : visualDistance`
 *
 * 자세한 설계는 docs/specs/phase-2/TECHSPEC.md §3 참조.
 */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type PlanetData = {
  id: PlanetId;
  name: { ko: string; en: string };

  // ─── 실제 값 (NASA 단위 그대로) ───────────────────────
  /** 평균 반지름 (km) */
  realRadius_km: number;
  /** 태양으로부터 평균 거리 (km) — 궤도 반장축 */
  realDistance_km: number;
  /** 공전 주기 (days) */
  orbitalPeriod_days: number;
  /** 자전 주기 (hours). 음수 = 역회전 (예: 금성 −5832h) */
  rotationPeriod_hours: number;

  // ─── 시각 값 (R3F scene unit) ─────────────────────────
  /** 화면에서 보이는 반지름 */
  visualRadius: number;
  /** 화면에서 보이는 태양으로부터 거리 */
  visualDistance: number;

  // ─── 시각화 자산 ─────────────────────────────────────
  /** 텍스처 경로 (public/textures/planets/{id}.jpg) */
  texture: string;
  /** 정보 패널용 한 단락 설명 */
  description: string;

  // ─── 위성 (지구만 보유) ──────────────────────────────
  moon?: MoonData;
};

export type MoonData = {
  realRadius_km: number;
  /** 모행성 중심부터의 평균 거리 (km) */
  realDistance_km: number;
  orbitalPeriod_days: number;
  visualRadius: number;
  visualDistance: number;
  texture: string;
};

// ═════════════════════════════════════════════════════════
//  데이터
// ═════════════════════════════════════════════════════════
//
// 지구 1개로 시작 (sub-phase 2-1).
// 8개로 확장은 sub-phase 2-2 에서.
//
// ─────────────────────────────────────────────────────────

export const EARTH: PlanetData = {
  id: 'earth',
  name: { ko: '지구', en: 'Earth' },

  realRadius_km: 6_371,
  realDistance_km: 149_598_000, // ≈ 1 AU
  orbitalPeriod_days: 365.256,
  rotationPeriod_hours: 23.934,

  visualRadius: 1, // 기준 단위 — 다른 행성은 이 값에 비례하여 깎음
  visualDistance: 0, // sub-phase 2-1 은 단일 행성이라 0. 2-2 에서 다시 깎음

  texture: '/textures/planets/earth.jpg',
  description:
    '우리 행성. 태양으로부터 1 AU (약 1.5억 km) 거리에 있고, 자전축이 23.5° 기울어 있어 사계절을 만든다. 지금까지 알려진 유일한 생명의 고향.',
};

/**
 * 모든 행성 — sub-phase 2-2 에서 8개로 확장.
 * 지금은 지구 1개만 export 하되, 배열 형태로 미리 만들어 두어
 * Scene 컴포넌트가 `PLANETS.map(...)` 패턴을 처음부터 쓸 수 있게 함.
 */
export const PLANETS: PlanetData[] = [EARTH];
