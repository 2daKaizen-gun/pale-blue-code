import { describe, it, expect } from 'vitest'
import { getBodyWorldPosition } from './bodyPosition'
import {
  DEFAULT_SCALE,
  computeVisualDistance,
  computeVisualRadius,
} from './scale'
import { findPlanetById } from '../data/planets'
import { SUN } from '../data/sun'

describe('getBodyWorldPosition', () => {
  it('태양은 원점 + 태양 반지름', () => {
    const sun = getBodyWorldPosition('sun', 0, DEFAULT_SCALE)!
    expect(sun.x).toBe(0)
    expect(sun.y).toBe(0)
    expect(sun.z).toBe(0)
    expect(sun.radius).toBeCloseTo(computeVisualRadius(SUN.realRadius_km, DEFAULT_SCALE))
  })

  it('행성은 황도면(y=0) 위, 태양으로부터 시각거리만큼 떨어져 있다', () => {
    const earth = findPlanetById('earth')!
    const body = getBodyWorldPosition('earth', 100, DEFAULT_SCALE)!
    expect(body.y).toBe(0)
    expect(Math.hypot(body.x, body.z)).toBeCloseTo(
      computeVisualDistance(earth.realDistance_km, DEFAULT_SCALE),
    )
    expect(body.radius).toBeCloseTo(
      computeVisualRadius(earth.realRadius_km, DEFAULT_SCALE),
    )
  })

  it('알 수 없는 천체는 null', () => {
    // @ts-expect-error 잘못된 id 런타임 방어 검증
    expect(getBodyWorldPosition('pluto', 0, DEFAULT_SCALE)).toBeNull()
  })

  it('결정적이다 — 같은 입력, 같은 출력', () => {
    const a = getBodyWorldPosition('mars', 42, DEFAULT_SCALE)
    const b = getBodyWorldPosition('mars', 42, DEFAULT_SCALE)
    expect(a).toEqual(b)
  })
})
