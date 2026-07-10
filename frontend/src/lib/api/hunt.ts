import type { BLSData } from './bls'
import { API_BASE_URL } from './base'

export interface HuntTarget {
  kic_id: number
  label: string
  description: string
  hint: string
}

export interface KOIMatch {
  kepoi_name: string
  disposition: 'CANDIDATE' | 'CONFIRMED' | 'FALSE POSITIVE'
  koi_period: number
  harmonic: number // bls_period / koi_period: 1 exact, 4 = 4x alias, 0.5 = half-period
}

export interface HuntLCData {
  kic_id: number
  time: number[]
  flux: number[]
  flux_err: number[]
  point_count: number
  original_count: number
}

export type CheckName = 'odd_even' | 'secondary' | 'shape' | 'size'

export interface VettingCheck {
  name: CheckName
  passed: boolean
  hard: boolean // a hard fail alone collapses trust (strong eclipsing-binary signal)
  metrics: Record<string, number> // backend returns numbers; the frontend renders sentences
}

export interface VettingReport {
  kic_id: number
  period: number // de-aliased true period the gates ran at
  bls_period: number // raw BLS peak (may be a ½×/2×/4× alias)
  alias_factor: number // period / bls_period (1 = BLS was already the true period)
  checks: VettingCheck[]
  passed_count: number
  total: number
  trust: 'strong' | 'weak' | 'unlikely'
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchHuntTargets(): Promise<HuntTarget[]> {
  return getJSON<HuntTarget[]>('/api/hunt/targets')
}

export async function fetchHuntLC(kicId: number): Promise<HuntLCData> {
  return getJSON<HuntLCData>(`/api/hunt/lc/${kicId}`)
}

export async function fetchHuntBLS(kicId: number): Promise<BLSData> {
  return getJSON<BLSData>(`/api/hunt/bls/${kicId}`)
}

export async function fetchKOICheck(kicId: number, period: number): Promise<KOIMatch[]> {
  return getJSON<KOIMatch[]>(`/api/hunt/koi-check?kic_id=${kicId}&period=${period}`)
}

export async function fetchVetting(kicId: number): Promise<VettingReport> {
  return getJSON<VettingReport>(`/api/hunt/vet/${kicId}`)
}

// ── Phase 9-B: the frontier (real solo hunt of unrecorded stars) ──────────────

export interface FrontierPick {
  kic_id: number
  recorded: boolean // the seed pool holds only unrecorded KICs (always false here)
}

export interface RecordedEntry {
  kepoi_name: string
  disposition: KOIMatch['disposition']
}

export interface RecordedCheck {
  kic_id: number
  recorded: boolean // true if the star has ANY KOI entry (period-independent)
  entries: RecordedEntry[]
}

// Draw one unrecorded KIC from the pre-verified frontier seed pool.
export async function frontierRandom(): Promise<FrontierPick> {
  return getJSON<FrontierPick>('/api/hunt/frontier/random')
}

// Is this star already on file? Period-independent KOI membership + its entries.
export async function checkRecorded(kicId: number): Promise<RecordedCheck> {
  return getJSON<RecordedCheck>(`/api/hunt/recorded/${kicId}`)
}
