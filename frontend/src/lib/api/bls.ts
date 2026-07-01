import { API_BASE_URL } from './base'

export interface BLSData {
  planet_name: string
  periods: number[]
  powers: number[]
  best: {
    period: number
    duration: number
    depth: number
    transit_time: number
    power: number
  }
}

export async function fetchBLS(planetName: string): Promise<BLSData> {
  const res = await fetch(`${API_BASE_URL}/api/bls/${encodeURIComponent(planetName)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `fetchBLS failed: ${res.status}`)
  }
  return res.json()
}
