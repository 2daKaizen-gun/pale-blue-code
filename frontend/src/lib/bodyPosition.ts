import type { BodyId } from '../store/solarSystemStore'
import { findPlanetById, getInitialAngle } from '../data/planets'
import { SUN } from '../data/sun'
import {
  type ScaleConfig,
  computeVisualRadius,
  computeVisualDistance,
} from './scale'
import { computeOrbitAngle } from './time'

/** 천체의 월드 위치 + 시각 반지름 (황도면 y=0). */
export type BodyWorldPosition = {
  x: number
  y: number
  z: number
  radius: number
}

/**
 * Pale Blue Code — Phase 2: Solar System
 *
 * getBodyWorldPosition — 천체(태양/행성)의 *현재* 월드 위치 + 반지름을 store 상태만으로
 * 결정하는 *순수 함수*. scene graph 를 읽지 않는다.
 *
 * ─── 왜 이게 중요한가 (sub-2-6 L6) ──────────
 *   카메라 추적(CameraController)과 천체 렌더가 *같은 함수* 로 위치를 구하면 둘이
 *   어긋날 수 없다. 추적이 "행성 옆 빈 공간" 을 가리키는 사고를 원천 차단.
 *   simulationDays + 보간된 ScaleConfig 만 있으면 결정적 → vitest 로 덮을 수 있음.
 *
 *   L6: 기존 CameraController inline 분기(sun/planet)를 *동작 변화 없이* 추출.
 *   L7: 여기에 'moon' 케이스 한 줄 추가 → 달 클릭 추적이 *테스트된 경로* 위에 올라감.
 *
 * @returns 알 수 없는 bodyId 면 null (호출 측에서 프레임 스킵).
 */
export function getBodyWorldPosition(
  bodyId: BodyId,
  simulationDays: number,
  config: ScaleConfig,
): BodyWorldPosition | null {
  if (bodyId === 'sun') {
    return {
      x: 0,
      y: 0,
      z: 0,
      radius: computeVisualRadius(SUN.realRadius_km, config),
    }
  }

  const planet = findPlanetById(bodyId)
  if (!planet) return null

  const orbitAngle = computeOrbitAngle(
    simulationDays,
    planet.orbitalPeriod_days,
    getInitialAngle(planet.id),
  )
  const distance = computeVisualDistance(planet.realDistance_km, config)
  return {
    x: Math.cos(orbitAngle) * distance,
    y: 0,
    z: Math.sin(orbitAngle) * distance,
    radius: computeVisualRadius(planet.realRadius_km, config),
  }
}
