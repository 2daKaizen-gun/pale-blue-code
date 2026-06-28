import type { BLSData } from './api/bls'
import type { KOIMatch } from './api/hunt'

// A self-contained record of one hunt: the BLS detection plus the KOI
// cross-check verdict. Assembled entirely on the client from data already in
// hand — exporting it lets a hunter keep (or report) what they found.
export interface DiscoveryRecord {
  schema: 'pale-blue-code/discovery@1'
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

export function buildDiscoveryRecord(
  kicId: number,
  bls: BLSData,
  matches: KOIMatch[],
): DiscoveryRecord {
  return {
    schema: 'pale-blue-code/discovery@1',
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
