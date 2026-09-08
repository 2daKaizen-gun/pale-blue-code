import { describe, expect, it } from 'vitest'
import type { MonotransitLedgerEntry } from '../../lib/api/monotransit'
import {
  EARTH_MAX_REARTH,
  countCandidates,
  dossierCompletenessNote,
  dossierFollowUpNote,
  dossierHeadline,
  earthTargetLine,
  floorLabel,
  reachLabel,
  selectEarthSizeTargets,
} from './earthSizeDossier'

const entry = (
  planet_name: string,
  min_planet_rearth: number | null,
  disposition: MonotransitLedgerEntry['disposition'] = 'no_event',
  depth_floor: number | null = 0.001,
): MonotransitLedgerEntry => ({
  planet_name,
  disposition,
  n_events: 0,
  significance: null,
  failed: [],
  depth_floor,
  size_class: null,
  min_planet_rjup: null,
  min_planet_rearth,
})

describe('selectEarthSizeTargets', () => {
  it('keeps only Earth-size-sensitive stars, sharpest first', () => {
    const ledger = [
      entry('tic-1', 1.2),
      entry('tic-2', 0.6),
      entry('tic-3', 2.5), // too big to be Earth-size sensitivity
    ]
    const got = selectEarthSizeTargets(ledger)
    expect(got.map((e) => e.planet_name)).toEqual(['tic-2', 'tic-1'])
  })

  it('drops stars with no measured reach (unsearched, or no radius) — never an Earth-size claim', () => {
    const ledger = [entry('tic-1', null), entry('tic-2', 0.6)]
    expect(selectEarthSizeTargets(ledger).map((e) => e.planet_name)).toEqual(['tic-2'])
  })

  it('respects a custom earthMax', () => {
    const ledger = [entry('tic-1', 1.0), entry('tic-2', 1.2)]
    expect(selectEarthSizeTargets(ledger, 1.1).map((e) => e.planet_name)).toEqual(['tic-1'])
    expect(EARTH_MAX_REARTH).toBe(1.25)
  })
})

describe('countCandidates', () => {
  it('counts only surviving candidates', () => {
    const targets = [entry('tic-1', 0.6, 'candidate'), entry('tic-2', 0.7, 'rejected')]
    expect(countCandidates(targets)).toBe(1)
  })
})

describe('dossierHeadline', () => {
  it('states sensitivity, not discovery, when there are no candidates', () => {
    const h = dossierHeadline(11, 0)
    expect(h).toContain('11')
    expect(h).toContain('살아남은 후보는 아직 없습니다')
    expect(h).not.toContain('발견')
  })

  it('names a surviving candidate when there is one', () => {
    expect(dossierHeadline(11, 1)).toContain('후보 1개')
  })

  it('is honest about an empty target set', () => {
    expect(dossierHeadline(0, 0)).toContain('아직 지구크기 감도에 닿은 표적이 없습니다')
  })
})

describe('dossierCompletenessNote', () => {
  it('is a completeness statement, never a discovery, for a zero-candidate dossier', () => {
    const note = dossierCompletenessNote(11, 0) as string
    expect(note).toContain('완전성 진술')
    expect(note).toContain('"발견"이 아니라')
  })

  it('is omitted when there is a candidate or no target', () => {
    expect(dossierCompletenessNote(11, 1)).toBeNull()
    expect(dossierCompletenessNote(0, 0)).toBeNull()
  })
})

describe('dossierFollowUpNote', () => {
  it('names the ExoFOP/TFOP bridge and the light-curve-alone limit', () => {
    const note = dossierFollowUpNote()
    expect(note).toContain('ExoFOP')
    expect(note).toContain('확정할 수 없습니다')
  })
})

describe('per-target labels', () => {
  it('reach is a minimum, never "is"', () => {
    expect(reachLabel(0.58)).toBe('지구 반지름의 0.58배 이상')
  })

  it('floor label is a percentage, or null when absent', () => {
    expect(floorLabel(0.001)).toBe('0.10%')
    expect(floorLabel(null)).toBeNull()
    expect(floorLabel(0)).toBeNull()
  })

  it('earthTargetLine folds reach, floor, and the honest verdict', () => {
    const line = earthTargetLine(entry('tic-1', 0.58, 'no_event', 0.001))
    expect(line).toContain('지구 반지름의 0.58배 이상')
    expect(line).toContain('검출 바닥 0.10%')
    expect(line).toContain('조용함')
  })

  it('a rejected Earth-size target still reports its reach but never as a find', () => {
    const line = earthTargetLine(entry('tic-1', 0.58, 'rejected'))
    expect(line).toContain('지구 반지름의 0.58배 이상')
    expect(line).toContain('기각')
  })
})
