import { API_BASE_URL } from './base'

export interface Planet {
  pl_name: string
  hostname: string
  discoverymethod: string
  disc_year: number | null
  pl_orbper: number | null
  pl_rade: number | null
  pl_masse: number | null
  pl_eqt: number | null
  sy_dist: number | null
  st_teff: number | null
  sy_pnum: number | null
  disc_facility: string | null
}

export async function fetchPlanets(): Promise<Planet[]> {
  const res = await fetch(`${API_BASE_URL}/api/planets`)
  if (!res.ok) throw new Error(`fetchPlanets failed: ${res.status}`)
  return res.json()
}

export async function fetchPlanet(name: string): Promise<Planet> {
  const res = await fetch(`${API_BASE_URL}/api/planets/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`fetchPlanet failed: ${res.status}`)
  return res.json()
}
