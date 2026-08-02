import { describe, expect, it } from 'vitest'
import type {
  FetchPlanSummary,
  MonotransitLedgerEntry,
  SizeVerdict,
} from '../../lib/api/monotransit'
import {
  fetchPlanBestTarget,
  fetchPlanHeadline,
  fetchPlanPendingNote,
  formatPeriodDays,
  huntHeadline,
  sensitivityCaption,
  sensitivityFloor,
  summarizeLedger,
  survivorPeriodNote,
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

describe('fetch plan copy', () => {
  const plan = (over: Partial<FetchPlanSummary>): FetchPlanSummary => ({
    plausible: 16,
    cached: 0,
    pending: 16,
    best_target: 'TIC 156004112',
    best_min_planet_rjup: 0.6,
    ...over,
  })

  it('headline names the target count and how many are searchable vs waiting', () => {
    const line = fetchPlanHeadline(plan({ plausible: 16, cached: 2, pending: 14 }))
    expect(line).toContain('16')
    expect(line).toContain('2')
    expect(line).toContain('14')
  })

  it('headline states an empty pool honestly, not as a failure', () => {
    expect(fetchPlanHeadline(plan({ plausible: 0 }))).toContain('행성 크기 표적이 없습니다')
  })

  it('best-target line names the smallest planet a detection could reveal', () => {
    const line = fetchPlanBestTarget(plan({})) as string
    expect(line).toContain('TIC 156004112')
    expect(line).toContain('0.60')
  })

  it('best-target line is null when there is no plausible target to omit the line', () => {
    expect(fetchPlanBestTarget(plan({ best_target: null, best_min_planet_rjup: null }))).toBeNull()
  })

  it('pending note states pending stars need a local fetch, and is honest about not looking', () => {
    const note = fetchPlanPendingNote(plan({ pending: 16 })) as string
    expect(note).toContain('16')
    expect(note).toContain('fetch')
    expect(note).toContain('보지 않은 곳') // never implies it looked where it did not
  })

  it('pending note is null when nothing is pending', () => {
    expect(fetchPlanPendingNote(plan({ pending: 0 }))).toBeNull()
  })
})

describe('survivorPeriodNote', () => {
  it('states the period as a lower bound, never as a measured period', () => {
    const note = survivorPeriodNote(15) as string
    expect(note).toContain('15')
    expect(note).toContain('최소')
    expect(note).toContain('하한')
  })

  it('names the long-period framing when the bound passes a sector span', () => {
    const note = survivorPeriodNote(260) as string
    expect(note).toContain('260')
    expect(note).toContain('긴 주기')
  })

  it('omits the long-period framing for a short bound', () => {
    const note = survivorPeriodNote(5) as string
    expect(note).not.toContain('긴 주기')
  })

  it('is null when no bound is known (no radius), so the caller omits the line', () => {
    expect(survivorPeriodNote(null)).toBeNull()
    expect(survivorPeriodNote(0)).toBeNull()
    expect(survivorPeriodNote(Number.NaN)).toBeNull()
  })

  it('formats short bounds with a decimal and long ones as whole days', () => {
    expect(formatPeriodDays(5.34)).toBe('5.3')
    expect(formatPeriodDays(260.7)).toBe('261')
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
