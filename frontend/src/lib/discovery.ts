import type { BLSData } from './api/bls'
import type { KOIMatch, VettingReport, VettingCheck } from './api/hunt'

// The vetting evidence, copied into the record so a discovery carries its own
// proof. `null` when vetting could not run (a vet miss must not block export —
// the detection + KOI verdict are still worth keeping). Trust and the four gate
// results travel with the record; the reader never has to re-run the engine.
export interface DiscoveryVetting {
  trust: VettingReport['trust']
  period_days: number // de-aliased true period the gates ran at
  bls_period_days: number // raw BLS peak (may be a ½×/2×/4× alias)
  alias_factor: number
  passed_count: number
  total: number
  checks: VettingCheck[]
}

// A self-contained record of one hunt: the BLS detection, the KOI cross-check
// verdict, and (as of @2) the four-gate vetting evidence. Assembled entirely on
// the client from data already in hand — exporting it lets a hunter keep (or
// report) what they found, evidence included.
export interface DiscoveryRecord {
  schema: 'pale-blue-code/discovery@2'
  generated_at: string
  target: {
    kic_id: number
    kic_name: string
  }
  detection: {
    method: 'BLS'
    period_days: number
    duration_days: number
    depth: number
    power: number
    transit_time: number
  }
  koi_cross_check: {
    in_catalog: boolean
    disposition: KOIMatch['disposition'] | null
    matches: KOIMatch[]
  }
  vetting: DiscoveryVetting | null
}

// Most-significant disposition wins when a star has several KOI entries:
// a confirmed planet outranks a mere candidate, which outranks a false positive.
const DISPOSITION_RANK: Record<KOIMatch['disposition'], number> = {
  CONFIRMED: 3,
  CANDIDATE: 2,
  'FALSE POSITIVE': 1,
}

function topDisposition(matches: KOIMatch[]): KOIMatch['disposition'] | null {
  if (matches.length === 0) return null
  return matches.reduce((best, m) =>
    DISPOSITION_RANK[m.disposition] > DISPOSITION_RANK[best.disposition] ? m : best,
  ).disposition
}

// `vetReport` is optional: a hunt whose vetting failed (or has not resolved) is
// still exportable, and the record honestly records `vetting: null` rather than
// fabricating a verdict.
export function buildDiscoveryRecord(
  kicId: number,
  bls: BLSData,
  matches: KOIMatch[],
  vetReport?: VettingReport | null,
): DiscoveryRecord {
  return {
    schema: 'pale-blue-code/discovery@2',
    generated_at: new Date().toISOString(),
    target: {
      kic_id: kicId,
      kic_name: `KIC ${kicId}`,
    },
    detection: {
      method: 'BLS',
      period_days: bls.best.period,
      duration_days: bls.best.duration,
      depth: bls.best.depth,
      power: bls.best.power,
      transit_time: bls.best.transit_time,
    },
    koi_cross_check: {
      in_catalog: matches.length > 0,
      disposition: topDisposition(matches),
      matches,
    },
    vetting: vetReport
      ? {
          trust: vetReport.trust,
          period_days: vetReport.period,
          bls_period_days: vetReport.bls_period,
          alias_factor: vetReport.alias_factor,
          passed_count: vetReport.passed_count,
          total: vetReport.total,
          checks: vetReport.checks,
        }
      : null,
  }
}

// Trigger a client-side file download of `data` as pretty-printed JSON.
export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
