import { describe, it, expect } from 'vitest'
import { PLANETS, getInitialAngle } from './planets'

const TWO_PI = Math.PI * 2

describe('getInitialAngle', () => {
  it('행성을 원 둘레에 균등 분산한다', () => {
    const step = TWO_PI / PLANETS.length
    expect(getInitialAngle(PLANETS[0].id)).toBeCloseTo(0)
    expect(getInitialAngle(PLANETS[1].id)).toBeCloseTo(step)
  })

  it('결정적이다 — 같은 id 면 같은 각도 (Scene === CameraController)', () => {
    expect(getInitialAngle('earth')).toBe(getInitialAngle('earth'))
  })

  it('[0, 2π) 범위 안이다', () => {
    for (const p of PLANETS) {
      const a = getInitialAngle(p.id)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(TWO_PI)
    }
  })
})
