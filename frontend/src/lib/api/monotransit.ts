import { API_BASE_URL } from './base'

/**
 * Phase 11 — the single-transit hunt (sub-11-3). BLS finds a planet by its
 * repetition; a world that crosses its star only once inside a TESS sector has
 * nothing to fold, so the machines discard it. This client reaches the hunt that
 * points our single-transit search at the frontier pool and reports, honestly, a
 * disposition for every star — survivors and empty-handed searches alike.
 */

// Where one star landed. Ordered from "closest to a real candidate" down to "never
// looked at" — the same order the backend ledger uses.
export type HuntDisposition =
  | 'candidate' // cleared significance AND every discriminator — a single-transit candidate
  | 'rejected' // significant, but a named discriminator (edge/coherence/flare/symmetry/baseline) caught it
  | 'held' // an event, but too little baseline to judge significance (the honest "unknown")
  | 'insignificant' // judged, and below the measured significance floor
  | 'no_event' // the search found no dip clearing the structural floors
  | 'not_fetched' // no light curve cached — nothing was searched, said plainly

export interface DiscriminatorCheck {
  name: string // edge | coherence | flare | symmetry | baseline
  passed: boolean
  value: number
}

// sub-11-6: what a detection on this star would MEAN (from the sub-11-5 pool triage). Carried on
// every survivor and ledger entry so a dip on a giant is reported but never mistaken for a planet.
export interface SizeVerdict {
  size_class: PoolClassification | null // plausible | too_big | unknown | null (no triage for this star)
  min_planet_rjup: number | null // smallest planet a detection here could reveal
  min_planet_rearth: number | null
}

export interface MonotransitSurvivor extends SizeVerdict {
  planet_name: string
  t0: number // event center, days
  duration: number // first-to-last contact, days
  depth: number // fitted trapezoid depth
  ses: number // matched-filter single-event statistic (white)
  significance: number | null // red-noise significance; null = held
  significant: boolean
  checks: DiscriminatorCheck[]
  passed: boolean
  candidate: boolean
  // sub-11-8: the shortest orbit this one transit could belong to (a b=0 lower bound),
  // or null when the star's radius is unknown. "at least", never "the period is".
  min_period_days: number | null
  // sub-11-9: the warmest this world could run — the closest orbit (from min_period_days) at
  // zero albedo, an upper bound. null when Teff/radius/period unknown. "at most", never "is".
  max_eq_temp_k: number | null
  // sub-11-10: the earliest calendar date (YYYY-MM-DD) a second transit could appear — t0 + the
  // minimum period. The earliest edge of the follow-up window; null when there is no period bound.
  earliest_recurrence: string | null
  // sub-11-11: the same numbers in an observer's frame for a follow-up hand-off — the epoch in
  // BJD_TDB (t0 + 2457000, the published/ExoFOP frame) and the depth in millimagnitudes (what a
  // photometrist measures). depth_mmag is null only for a non-physical depth.
  epoch_bjd_tdb: number | null
  depth_mmag: number | null
}

export interface MonotransitLedgerEntry extends SizeVerdict {
  planet_name: string
  disposition: HuntDisposition
  n_events: number
  significance: number | null
  failed: string[] // discriminators that caught a rejected event
  depth_floor: number | null // shallowest transit this star's curve could have shown; null = not searched
}

export interface MonotransitHunt {
  mission: string
  searched: number // stars with a cached light curve actually searched
  survivors: MonotransitSurvivor[]
  ledger: MonotransitLedgerEntry[]
}

// The hunt is TESS-only — the frontier pool is TESS.
export async function monotransitHunt(): Promise<MonotransitHunt> {
  const res = await fetch(`${API_BASE_URL}/api/monotransit/hunt?mission=tess`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `request failed: ${res.status}`)
  }
  return res.json()
}

// A detection would be a planet, a star, or we cannot say without a radius.
export type PoolClassification = 'plausible' | 'too_big' | 'unknown'

export interface PoolTarget {
  tic: number
  tmag: number | null
  constellation: string | null
  stellar_radius: number | null // R_sun
  min_planet_rjup: number | null // smallest planet a detection here could reveal
  min_planet_rearth: number | null
  classification: PoolClassification
}

export interface PoolSummary {
  total: number
  plausible: number // a detection could be a planet
  too_big: number // a detection would be a star
  unknown: number // no stellar radius on file
  depth_floor: number // fiducial detection floor used
  planet_max_rjup: number // the planet / star size boundary
}

export interface PoolAssessment {
  targets: PoolTarget[]
  summary: PoolSummary
}

// Where a detectable dip would mean a planet vs a star — pure catalog geometry, no fetch.
export async function monotransitPool(): Promise<PoolAssessment> {
  const res = await fetch(`${API_BASE_URL}/api/monotransit/pool`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `request failed: ${res.status}`)
  }
  return res.json()
}

// sub-11-13: the light curve behind a star's verdict, for the drilldown. The same detrended,
// normalized curve the search saw (decimated for the browser) plus the events it found, so the
// view can mark each dip and colour it by verdict.
export interface MonotransitCurveEvent {
  t0: number // event center, same time frame as the curve
  duration: number
  depth: number
  significance: number | null
  significant: boolean
  passed: boolean
  candidate: boolean
  failed_checks: string[] // shape gates this event failed (edge|coherence|flare|symmetry|baseline), even below the floor
}

export interface MonotransitCurve {
  planet_name: string
  mission: string
  time: number[]
  flux: number[]
  point_count: number
  original_count: number
  depth_floor: number | null
  events: MonotransitCurveEvent[]
}

// Fetch the searched curve for one star; 424 (rejected promise) if its light was never fetched.
export async function monotransitCurve(planetName: string): Promise<MonotransitCurve> {
  const res = await fetch(`${API_BASE_URL}/api/monotransit/${encodeURIComponent(planetName)}/curve`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `request failed: ${res.status}`)
  }
  return res.json()
}

// sub-11-7: the fetch plan — which plausible dwarfs are worth fetching, cached or pending, best
// target first. Deterministic; the actual fetch is a separate local step, never this request.
export interface FetchTarget {
  tic: number
  star_name: string
  min_planet_rjup: number | null // smallest planet a detection here could reveal
  min_planet_rearth: number | null
  cached: boolean // its light curve is already on disk (the hunt can search it)
}

export interface FetchPlanSummary {
  plausible: number // plausible dwarfs worth a fetch
  cached: number // already searchable
  pending: number // still waiting on their light
  best_target: string | null // the smallest-planet target
  best_min_planet_rjup: number | null
}

export interface FetchPlan {
  targets: FetchTarget[]
  summary: FetchPlanSummary
}

// The plausible dwarfs to fetch — deterministic, no network in this request.
export async function monotransitFetchPlan(): Promise<FetchPlan> {
  const res = await fetch(`${API_BASE_URL}/api/monotransit/fetch-plan`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `request failed: ${res.status}`)
  }
  return res.json()
}
