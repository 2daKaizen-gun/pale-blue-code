import type { BLSData } from './bls'
import { API_BASE_URL } from './base'

// Phase 10 — Skyward. Which sky a frontier hunt draws from. Every hunt endpoint
// takes `?mission=` (default kepler, backward compatible); we omit it for Kepler
// so pre-Phase-10 URLs are unchanged and only tag TESS explicitly.
export type Mission = 'kepler' | 'tess'
const missionQuery = (m: Mission) => (m === 'tess' ? '?mission=tess' : '')

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
  // Phase 10, honesty nail 4 — confidence scaled to how much sky-time we saw.
  mission: Mission // which survey named the star (KIC vs TIC labelling)
  baseline_days: number // observed span the gates saw; short = blunt vetter
  transit_count: number // floor(baseline / period): transit epochs observed
  sector_count: number | null // TESS sectors stitched (null for Kepler)
  provisional: boolean // strong, but on too few transits → "provisional strong"
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

export async function fetchHuntLC(kicId: number, mission: Mission = 'kepler'): Promise<HuntLCData> {
  return getJSON<HuntLCData>(`/api/hunt/lc/${kicId}${missionQuery(mission)}`)
}

export async function fetchHuntBLS(kicId: number, mission: Mission = 'kepler'): Promise<BLSData> {
  return getJSON<BLSData>(`/api/hunt/bls/${kicId}${missionQuery(mission)}`)
}

export async function fetchKOICheck(kicId: number, period: number): Promise<KOIMatch[]> {
  return getJSON<KOIMatch[]>(`/api/hunt/koi-check?kic_id=${kicId}&period=${period}`)
}

export async function fetchVetting(kicId: number, mission: Mission = 'kepler'): Promise<VettingReport> {
  return getJSON<VettingReport>(`/api/hunt/vet/${kicId}${missionQuery(mission)}`)
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

// Draw one unrecorded star from the pre-verified frontier seed pool.
// Kepler → unrecorded KIC; TESS → unrecorded TIC.
export async function frontierRandom(mission: Mission = 'kepler'): Promise<FrontierPick> {
  return getJSON<FrontierPick>(`/api/hunt/frontier/random${missionQuery(mission)}`)
}

// Is this star already on file? Period-independent catalog membership + its
// entries — KOI (by kepid) for Kepler, TOI (by tid) for TESS.
export async function checkRecorded(kicId: number, mission: Mission = 'kepler'): Promise<RecordedCheck> {
  return getJSON<RecordedCheck>(`/api/hunt/recorded/${kicId}${missionQuery(mission)}`)
}
