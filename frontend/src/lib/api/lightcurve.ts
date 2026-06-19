export interface LightCurveData {
  planet_name: string
  hostname: string
  mission: string
  time: number[]
  flux: number[]
  flux_err: number[]
  period: number | null
  point_count: number
  original_count: number
}

export interface PhaseFoldData {
  planet_name: string
  period: number
  phase: number[]
  flux: number[]
  flux_err: number[]
  transit_depth: number | null
  transit_duration: number | null
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function fetchLightCurve(
  planetName: string,
  mission = 'Kepler',
): Promise<LightCurveData> {
  const res = await fetch(
    `${BASE_URL}/api/lightcurve/${encodeURIComponent(planetName)}?mission=${mission}`,
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `fetchLightCurve failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchFolded(
  planetName: string,
  mission = 'Kepler',
  bins = 200,
): Promise<PhaseFoldData> {
  const res = await fetch(
    `${BASE_URL}/api/lightcurve/${encodeURIComponent(planetName)}/folded?mission=${mission}&bins=${bins}`,
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `fetchFolded failed: ${res.status}`)
  }
  return res.json()
}
