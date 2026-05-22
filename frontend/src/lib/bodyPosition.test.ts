import { describe, it, expect } from 'vitest'
import { getBodyWorldPosition, getMoonLocalOffset } from './bodyPosition'
import {
  DEFAULT_SCALE,
  computeVisualDistance,
  computeVisualRadius,
  computeMoonVisualDistance,
  computeMoonVisualRadius,
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

describe('getBodyWorldPosition — moon (sub-2-6)', () => {
  it('달 = 지구 위치 + 달 offset (지구로부터 궤도 거리만큼 떨어짐)', () => {
    const earth = findPlanetById('earth')!
    const moon = earth.moon!
    const earthPos = getBodyWorldPosition('earth', 50, DEFAULT_SCALE)!
    const moonPos = getBodyWorldPosition('moon', 50, DEFAULT_SCALE)!
    expect(moonPos.y).toBe(0)
    const earthMoonDist = Math.hypot(moonPos.x - earthPos.x, moonPos.z - earthPos.z)
    expect(earthMoonDist).toBeCloseTo(
      computeMoonVisualDistance(moon.realDistance_km, earth.realRadius_km, DEFAULT_SCALE),
    )
    expect(moonPos.radius).toBeCloseTo(
      computeMoonVisualRadius(moon.realRadius_km, earth.realRadius_km, DEFAULT_SCALE),
    )
  })

  it('getMoonLocalOffset 은 결정적이고 궤도 거리를 보존한다', () => {
    const earth = findPlanetById('earth')!
    const moon = earth.moon!
    const off = getMoonLocalOffset(moon, earth.realRadius_km, 77, DEFAULT_SCALE)
    expect(Math.hypot(off.x, off.z)).toBeCloseTo(
      computeMoonVisualDistance(moon.realDistance_km, earth.realRadius_km, DEFAULT_SCALE),
    )
    expect(getMoonLocalOffset(moon, earth.realRadius_km, 77, DEFAULT_SCALE)).toEqual(off)
  })
})
