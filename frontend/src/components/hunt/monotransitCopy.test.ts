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
  formatEpochBjdTdb,
  formatMmag,
  formatPeriodDays,
  formatTempK,
  huntHeadline,
  sensitivityCaption,
  sensitivityFloor,
  STAR_VERDICT,
  starVerdictSentence,
  summarizeLedger,
  survivorFollowUpBrief,
  survivorPeriodNote,
  survivorRecurrenceNote,
  survivorSizeNote,
  survivorTempNote,
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

describe('survivorTempNote', () => {
  it('states the temperature as an upper bound, never as a measured value', () => {
    const note = survivorTempNote(410) as string
    expect(note).toContain('410')
    expect(note).toContain('많아야')
    expect(note).toContain('상한')
  })

  it('names the temperate framing when even the warmest case is cool enough to ask about', () => {
    const note = survivorTempNote(300) as string
    expect(note).toContain('온화')
  })

  it('omits the temperate framing when even the warmest case is hot', () => {
    const note = survivorTempNote(900) as string
    expect(note).not.toContain('온화')
  })

  it('is null when no bound is known (no Teff/radius/period), so the caller omits the line', () => {
    expect(survivorTempNote(null)).toBeNull()
    expect(survivorTempNote(0)).toBeNull()
    expect(survivorTempNote(Number.NaN)).toBeNull()
  })

  it('formats the temperature as whole kelvin', () => {
    expect(formatTempK(278.6)).toBe('279')
    expect(formatTempK(410.2)).toBe('410')
  })
})

describe('survivorRecurrenceNote', () => {
  it('states the date as the earliest a second transit could appear, not a predicted time', () => {
    const note = survivorRecurrenceNote('2015-03-28') as string
    expect(note).toContain('2015-03-28')
    expect(note).toContain('아무리 일러도') // "no earlier than" — the near edge, a bound
    expect(note).toContain('후속 관측 창') // the follow-up window it opens
  })

  it('says the real recurrence is likely later, never that the next transit is on that date', () => {
    const note = survivorRecurrenceNote('2020-06-01') as string
    expect(note).toContain('더 길') // the true period can only be longer
    expect(note).toContain('늦습니다') // so the real recurrence is later
  })

  it('is null when no date is known (no period bound), so the caller omits the line', () => {
    expect(survivorRecurrenceNote(null)).toBeNull()
    expect(survivorRecurrenceNote('')).toBeNull()
  })
})

describe('readout: one star = one honest sentence', () => {
  const led = (
    disposition: MonotransitLedgerEntry['disposition'],
    over: Partial<MonotransitLedgerEntry> = {},
  ): MonotransitLedgerEntry => ({
    planet_name: 'TIC 1',
    disposition,
    n_events: 0,
    significance: null,
    failed: [],
    depth_floor: null,
    size_class: null,
    min_planet_rjup: null,
    min_planet_rearth: null,
    ...over,
  })

  it('the verdict chips are plain words, not the machine vocabulary', () => {
    expect(STAR_VERDICT.no_event).toBe('조용함')
    expect(STAR_VERDICT.insignificant).toBe('잡음')
    expect(STAR_VERDICT.not_fetched).toBe('미관측')
    // never leaks the API disposition keys to the reader
    for (const word of Object.values(STAR_VERDICT)) {
      expect(word).not.toMatch(/no_event|insignificant|disposition|held/)
    }
  })

  it('a quiet star reads as an honest result and states how deep it could have seen', () => {
    const s = starVerdictSentence(led('no_event', { depth_floor: 0.0005 }))
    expect(s).toContain('0.05%') // the sensitivity floor, as evidence the quiet is real
    expect(s).toContain('조용') // quiet, a verdict — not "no results" as a failure
  })

  it('a quiet star with no floor still reads honestly, without inventing a number', () => {
    const s = starVerdictSentence(led('no_event', { depth_floor: null }))
    expect(s).toContain('조용')
    expect(s).not.toContain('%')
  })

  it('a rejected star names the discriminator in human terms, never "planet"', () => {
    const s = starVerdictSentence(led('rejected', { failed: ['symmetry'] }))
    expect(s).toContain('비대칭') // the human reading of the symmetry gate
    expect(s).toContain('계기·항성') // framed as an instrument/stellar signal
    expect(s).toContain('행성이 아니라') // explicitly framed as NOT a planet
  })

  it('a held star says the baseline was too short, an honest unknown', () => {
    const s = starVerdictSentence(led('held'))
    expect(s).toContain('짧아')
    expect(s).toContain('보류')
  })

  it('a candidate reads as worth a human look', () => {
    const s = starVerdictSentence(led('candidate'))
    expect(s).toContain('후보')
    expect(s).toContain('볼 가치')
  })

  it('an unfetched star never implies it was looked at', () => {
    const s = starVerdictSentence(led('not_fetched'))
    expect(s).toContain('보지 않')
  })
})

describe('survivorFollowUpBrief', () => {
  it('reads the epoch in BJD_TDB and the depth in millimagnitudes, with the duration in hours', () => {
    const brief = survivorFollowUpBrief(2458500.1234, 10.9, 0.3, null) as string
    expect(brief).toContain('BJD_TDB')
    expect(brief).toContain('2458500.1234')
    expect(brief).toContain('mmag')
    expect(brief).toContain('10.9')
    expect(brief).toContain('7.2시간') // 0.3 d * 24 = 7.2 h
  })

  it('carries the candidate and one-sided-bound caveats — never a confirmed planet', () => {
    const brief = survivorFollowUpBrief(2458500.0, 10.9, 0.3, null) as string
    expect(brief).toContain('행성 아님') // still a candidate, not a planet
    expect(brief).toContain('한쪽 경계') // the bounds are still one-sided
  })

  it('folds in the earliest recurrence when it is known', () => {
    const brief = survivorFollowUpBrief(2458500.0, 10.9, 0.3, '2019-05-15') as string
    expect(brief).toContain('2019-05-15')
    expect(brief).toContain('아무리 일러도')
  })

  it('omits the recurrence clause when there is no date', () => {
    const brief = survivorFollowUpBrief(2458500.0, 10.9, 0.3, null) as string
    expect(brief).not.toContain('아무리 일러도')
  })

  it('is null when the core observer numbers are missing, so the caller omits it', () => {
    expect(survivorFollowUpBrief(null, 10.9, 0.3, null)).toBeNull()
    expect(survivorFollowUpBrief(2458500.0, null, 0.3, null)).toBeNull()
  })

  it('formats the epoch to four decimals and the depth to one', () => {
    expect(formatEpochBjdTdb(2458500.123456)).toBe('2458500.1235')
    expect(formatMmag(10.912)).toBe('10.9')
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
