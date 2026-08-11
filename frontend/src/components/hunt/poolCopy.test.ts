import { describe, expect, it } from 'vitest'
import type { PoolSummary, PoolTarget } from '../../lib/api/monotransit'
import { minPlanetLabel, poolHeadline } from './poolCopy'

const summary = (over: Partial<PoolSummary> = {}): PoolSummary => ({
  total: 50,
  plausible: 16,
  too_big: 34,
  unknown: 0,
  depth_floor: 0.004,
  planet_max_rjup: 2.0,
  ...over,
})

describe('poolHeadline', () => {
  it('leads with how few stars could host a planet and how many are giants', () => {
    const line = poolHeadline(summary())
    expect(line).toContain('50')
    expect(line).toContain('16')
    expect(line).toContain('34')
    expect(line).not.toContain('반지름을 알 수 없습니다') // no unknowns -> no unknown clause
  })

  it('mentions the radiusless stars only when there are any', () => {
    expect(poolHeadline(summary({ unknown: 3 }))).toContain('반지름을 알 수 없습니다')
  })

  it('leads with "all planet-size" when the dwarf-selected pool has no giants', () => {
    const line = poolHeadline(summary({ plausible: 50, too_big: 0 }))
    expect(line).toContain('전부가 행성 크기 표적')
    expect(line).not.toContain('검출돼도 별') // no giants to name
  })
})

describe('minPlanetLabel', () => {
  const target = (min_planet_rjup: number | null): PoolTarget => ({
    tic: 1,
    tmag: 8,
    constellation: 'Pavo',
    stellar_radius: 1,
    min_planet_rjup,
    min_planet_rearth: min_planet_rjup == null ? null : min_planet_rjup * 11.2,
    classification: min_planet_rjup == null ? 'unknown' : 'plausible',
  })

  it('shows the floor radius in Jupiter radii', () => {
    expect(minPlanetLabel(target(0.63))).toContain('0.63')
  })

  it('shows a dash when there is no radius to compute from', () => {
    expect(minPlanetLabel(target(null))).toBe('—')
  })
})
