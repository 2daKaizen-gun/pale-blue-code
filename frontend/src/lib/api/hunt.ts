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
