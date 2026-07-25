import { describe, it, expect } from 'vitest'
import {
  computeStats,
  appendEntry,
  parseLog,
  serializeLog,
  type HuntLogEntry,
} from './huntLog'

/**
 * Pale Blue Code — Phase 9-B: hunt log aggregation (pure core).
 *
 * The frontier's honesty rests on an honest tally (9B-PLAN §3-3): "N번 사냥,
 * 후보 M". These tests pin the two things that make that tally honest —
 *   1. `hunts` counts only outcomes that actually ran the vetter; a star turned
 *      away at the gate (recorded / no light curve) is NOT a hunt.
 *   2. a corrupt localStorage value degrades to an empty log, never a crash.
 */

const entry = (kic_id: number, outcome: HuntLogEntry['outcome']): HuntLogEntry => ({
  kic_id,
  outcome,
  at: '2026-07-16T00:00:00.000Z',
})

describe('computeStats', () => {
  it('empty log is all zeros', () => {
    expect(computeStats([])).toEqual({
      hunts: 0,
      candidates: 0,
      weak: 0,
      emptyHands: 0,
      recorded: 0,
      noLc: 0,
    })
  })

  it('counts only vetter-run outcomes as hunts (recorded/no_lc are not hunts)', () => {
    const stats = computeStats([
      entry(1, 'strong'),
      entry(2, 'weak'),
      entry(3, 'unlikely'),
      entry(4, 'unlikely'),
      entry(5, 'recorded'), // turned away at the gate — not a hunt
      entry(6, 'no_lc'), // Kepler never observed it — not a hunt
    ])
    // 4 real hunts (strong + weak + 2×unlikely); the 2 gate rejections are apart.
    expect(stats.hunts).toBe(4)
    expect(stats.candidates).toBe(1)
    expect(stats.weak).toBe(1)
    expect(stats.emptyHands).toBe(2)
    expect(stats.recorded).toBe(1)
    expect(stats.noLc).toBe(1)
  })

  it('insignificant is a hunt with empty hands (nail 5), never a candidate', () => {
    // The precondition ran and found no real detection — the vetter did run, so it
    // counts as a hunt, but it is empty hands, not a candidate.
    const stats = computeStats([
      entry(1, 'strong'),
      entry(2, 'insignificant'),
      entry(3, 'insignificant'),
    ])
    expect(stats.hunts).toBe(3)
    expect(stats.candidates).toBe(1)
    expect(stats.emptyHands).toBe(2)
  })

  it('the honest frontier majority: many hunts, zero candidates', () => {
    const empties = Array.from({ length: 37 }, (_, i) => entry(i, 'unlikely'))
    const stats = computeStats(empties)
    expect(stats.hunts).toBe(37)
    expect(stats.candidates).toBe(0)
    expect(stats.emptyHands).toBe(37)
  })
})

describe('appendEntry', () => {
  it('appends without mutating the input', () => {
    const before: HuntLogEntry[] = [entry(1, 'unlikely')]
    const after = appendEntry(before, entry(2, 'strong'))
    expect(before).toHaveLength(1) // input untouched
    expect(after).toHaveLength(2)
    expect(after[1].kic_id).toBe(2)
  })

  it('keeps the log bounded to the most recent 500 entries', () => {
    let log: HuntLogEntry[] = []
    for (let i = 0; i < 505; i++) log = appendEntry(log, entry(i, 'unlikely'))
    expect(log).toHaveLength(500)
    expect(log[0].kic_id).toBe(5) // oldest 5 fell off the front
    expect(log[log.length - 1].kic_id).toBe(504)
  })
})

describe('parseLog', () => {
  it('round-trips through serializeLog', () => {
    const log = [entry(11446443, 'recorded'), entry(2557393, 'unlikely')]
    expect(parseLog(serializeLog(log))).toEqual(log)
  })

  it('degrades corrupt / missing / wrong-shape data to an empty log', () => {
    expect(parseLog(null)).toEqual([])
    expect(parseLog('')).toEqual([])
    expect(parseLog('not json')).toEqual([])
    expect(parseLog('{"not":"an array"}')).toEqual([])
  })

  it('drops individual malformed entries but keeps valid ones', () => {
    const raw = JSON.stringify([
      { kic_id: 1, outcome: 'strong', at: '2026-07-16T00:00:00.000Z' },
      { kic_id: 'nope', outcome: 'strong', at: 'x' }, // bad kic_id
      { kic_id: 2, outcome: 'made_up', at: 'x' }, // bad outcome
      { kic_id: 3, outcome: 'unlikely', at: '2026-07-16T00:00:00.000Z' },
    ])
    const parsed = parseLog(raw)
    expect(parsed).toHaveLength(2)
    expect(parsed.map((e) => e.kic_id)).toEqual([1, 3])
  })
})
