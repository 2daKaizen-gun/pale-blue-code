import { describe, it, expect } from 'vitest'
import { buildDiscoveryRecord, parseDiscoveryRecord, type DiscoveryRecord } from './discovery'
import type { BLSData } from './api/bls'
import type { KOIMatch, VettingReport } from './api/hunt'

const bls: BLSData = {
  planet_name: 'KIC 42',
  periods: [],
  powers: [],
  best: { period: 3.5, duration: 0.12, depth: 0.008, transit_time: 131.2, power: 0.0042 },
}

const koi = (disposition: KOIMatch['disposition']): KOIMatch => ({
  kepoi_name: `K0${disposition[0]}`,
  disposition,
  koi_period: 3.5,
  harmonic: 1,
})

function vetReport(over: Partial<VettingReport> = {}): VettingReport {
  return {
    kic_id: 42,
    period: 3.5,
    bls_period: 1.75,
    alias_factor: 2,
    checks: [],
    passed_count: 4,
    total: 4,
    trust: 'strong',
    mission: 'kepler',
    baseline_days: 1400,
    transit_count: 40,
    sector_count: null,
    provisional: false,
    significance: 6.2,
    significant: true,
    ...over,
  }
}

describe('buildDiscoveryRecord', () => {
  it('maps the BLS detection fields verbatim', () => {
    const rec = buildDiscoveryRecord(42, bls, [])
    expect(rec.schema).toBe('pale-blue-code/discovery@2')
    expect(rec.target).toEqual({ kic_id: 42, kic_name: 'KIC 42' })
    expect(rec.detection).toMatchObject({
      method: 'BLS',
      period_days: 3.5,
      duration_days: 0.12,
      depth: 0.008,
      power: 0.0042,
      transit_time: 131.2,
    })
    expect(typeof rec.generated_at).toBe('string')
  })

  it('marks in_catalog false and disposition null when there are no KOI matches', () => {
    const rec = buildDiscoveryRecord(42, bls, [])
    expect(rec.koi_cross_check.in_catalog).toBe(false)
    expect(rec.koi_cross_check.disposition).toBe(null)
  })

  it('picks the most-significant disposition (CONFIRMED > CANDIDATE > FALSE POSITIVE)', () => {
    const matches = [koi('FALSE POSITIVE'), koi('CONFIRMED'), koi('CANDIDATE')]
    const rec = buildDiscoveryRecord(42, bls, matches)
    expect(rec.koi_cross_check.in_catalog).toBe(true)
    expect(rec.koi_cross_check.disposition).toBe('CONFIRMED')
  })

  it('a candidate outranks a false positive when no confirmed entry exists', () => {
    const rec = buildDiscoveryRecord(42, bls, [koi('FALSE POSITIVE'), koi('CANDIDATE')])
    expect(rec.koi_cross_check.disposition).toBe('CANDIDATE')
  })

  it('carries vetting evidence when a report is given', () => {
    const rec = buildDiscoveryRecord(42, bls, [], vetReport({ trust: 'weak', passed_count: 2 }))
    expect(rec.vetting).not.toBe(null)
    expect(rec.vetting).toMatchObject({
      trust: 'weak',
      period_days: 3.5,
      bls_period_days: 1.75,
      alias_factor: 2,
      passed_count: 2,
      total: 4,
    })
  })

  it('records vetting: null when the report is missing (a vet miss must not block export)', () => {
    expect(buildDiscoveryRecord(42, bls, []).vetting).toBe(null)
    expect(buildDiscoveryRecord(42, bls, [], null).vetting).toBe(null)
  })
})

describe('parseDiscoveryRecord', () => {
  it('passes a current @2 record through unchanged', () => {
    const rec = buildDiscoveryRecord(42, bls, [koi('CONFIRMED')], vetReport())
    expect(parseDiscoveryRecord(rec)).toEqual(rec)
  })

  it('upgrades a legacy @1 record to @2, filling vetting: null', () => {
    const legacy = {
      schema: 'pale-blue-code/discovery@1',
      generated_at: '2026-01-01T00:00:00.000Z',
      target: { kic_id: 7, kic_name: 'KIC 7' },
      detection: { method: 'BLS', period_days: 2, duration_days: 0.1, depth: 0.01, power: 0.5, transit_time: 100 },
      koi_cross_check: { in_catalog: false, disposition: null, matches: [] },
    }
    const parsed = parseDiscoveryRecord(legacy)
    expect(parsed.schema).toBe('pale-blue-code/discovery@2')
    expect(parsed.vetting).toBe(null)
    // the rest of the legacy record is preserved
    expect(parsed.target).toEqual({ kic_id: 7, kic_name: 'KIC 7' })
    expect(parsed.detection.period_days).toBe(2)
  })

  it('throws on a missing schema tag', () => {
    expect(() => parseDiscoveryRecord({ target: {} })).toThrow(/schema/)
    expect(() => parseDiscoveryRecord(null)).toThrow(/schema/)
  })

  it('throws on an unsupported schema version', () => {
    expect(() => parseDiscoveryRecord({ schema: 'pale-blue-code/discovery@99' })).toThrow(/Unsupported/)
  })
})

// A round-trip a future discovery repository (9-C) depends on: build → parse is identity.
describe('discovery round-trip', () => {
  it('build then parse returns an equivalent record', () => {
    const built: DiscoveryRecord = buildDiscoveryRecord(99, bls, [koi('CANDIDATE')], vetReport())
    expect(parseDiscoveryRecord(built)).toEqual(built)
  })
})
