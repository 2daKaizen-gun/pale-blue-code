import { describe, expect, it } from 'vitest'
import type { MonotransitLedgerEntry, SizeVerdict } from '../../lib/api/monotransit'
import {
  huntHeadline,
  sensitivityCaption,
  sensitivityFloor,
  summarizeLedger,
  survivorSizeNote,
} from './monotransitCopy'

const entry = (
  disposition: MonotransitLedgerEntry['disposition'],
  depth_floor: number | null = null,
): MonotransitLedgerEntry => ({
  planet_name: 'TIC 1',
  disposition,
  n_events: 0,
  significance: null,
  failed: [],
  depth_floor,
  size_class: null,
  min_planet_rjup: null,
  min_planet_rearth: null,
})

describe('summarizeLedger', () => {
  it('counts every star and orders closest-to-a-candidate first', () => {
    const out = summarizeLedger([
      entry('not_fetched'),
      entry('candidate'),
      entry('no_event'),
      entry('candidate'),
      entry('not_fetched'),
    ])
    expect(out.map((c) => c.disposition)).toEqual(['candidate', 'no_event', 'not_fetched'])
    expect(out.find((c) => c.disposition === 'candidate')?.count).toBe(2)
    expect(out.find((c) => c.disposition === 'not_fetched')?.count).toBe(2)
  })

  it('drops dispositions that never occurred', () => {
    const out = summarizeLedger([entry('no_event')])
    expect(out).toHaveLength(1)
    expect(out[0].disposition).toBe('no_event')
  })

  it('accounts for all stars (counts sum to the ledger length)', () => {
    const ledger = [entry('candidate'), entry('rejected'), entry('held'), entry('not_fetched')]
    const total = summarizeLedger(ledger).reduce((s, c) => s + c.count, 0)
    expect(total).toBe(ledger.length)
  })
})

describe('sensitivityFloor', () => {
  it('is the median per-star floor over the searched stars, ignoring the unfetched', () => {
    const floor = sensitivityFloor([
      entry('no_event', 0.002),
      entry('insignificant', 0.004),
      entry('rejected', 0.006),
      entry('not_fetched', null), // no floor — must not drag the median
    ])
    expect(floor).toBeCloseTo(0.004, 6)
  })

  it('is null when nothing was searched (no floor to state)', () => {
    expect(sensitivityFloor([entry('not_fetched'), entry('not_fetched')])).toBeNull()
  })
})

describe('sensitivityCaption', () => {
  it('states the floor as a floor, not as a completeness guarantee', () => {
    const line = sensitivityCaption(0.004) as string
    expect(line).toContain('0.40%')
    expect(line).toContain('넘지 못합니다') // "cannot clear" — a floor, not "we would have found"
  })

  it('is null when there is no floor, so the caller omits the line', () => {
    expect(sensitivityCaption(null)).toBeNull()
  })
})

describe('huntHeadline', () => {
  it('leads with the candidate count when something survived', () => {
    expect(huntHeadline(12, 1)).toContain('후보 1개')
  })

  it('states the empty-handed result as honest, not a failure, when nothing survived', () => {
    const line = huntHeadline(12, 0)
    expect(line).toContain('12')
    expect(line).toContain('정직한 결과')
  })

  it('tells the user to fetch light curves first when nothing was searched', () => {
    expect(huntHeadline(0, 0)).toContain('빛을 받아오세요')
  })
})

describe('survivorSizeNote', () => {
  const sized = (over: Partial<SizeVerdict>): SizeVerdict => ({
    size_class: null,
    min_planet_rjup: null,
    min_planet_rearth: null,
    ...over,
  })

  it('names a plausible survivor as planet-sized with its minimum radius', () => {
    const note = survivorSizeNote(sized({ size_class: 'plausible', min_planet_rjup: 0.6 }))
    expect(note).toContain('행성 크기')
    expect(note).toContain('0.60')
  })

  it('names a too_big survivor as a star, never a planet', () => {
    const note = survivorSizeNote(sized({ size_class: 'too_big', min_planet_rjup: 8 }))
    expect(note).toContain('별')
    expect(note).not.toContain('행성 크기')
  })

  it('reads unknown for a star with no triage, not a guess', () => {
    expect(survivorSizeNote(sized({ size_class: null }))).toBe('크기 미상')
    expect(survivorSizeNote(sized({ size_class: 'unknown' }))).toBe('크기 미상')
  })
})
