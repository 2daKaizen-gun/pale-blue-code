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

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function fetchBLS(planetName: string): Promise<BLSData> {
  const res = await fetch(`${BASE_URL}/api/bls/${encodeURIComponent(planetName)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.message ?? body.detail ?? `fetchBLS failed: ${res.status}`)
  }
  return res.json()
}
