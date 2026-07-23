import { API_BASE_URL } from './base'

// A tiny liveness probe against the backend's /api/health. Used by the status
// banner so a hosted page that cannot reach its backend says so, instead of
// rendering silent empty states everywhere. Deliberately three-valued: we care
// whether the origin is *reachable* (unreachable = wrong URL / backend down /
// CORS), distinct from a reachable backend answering non-200.

export type HealthState =
  | 'ok' // reachable, 200
  | 'error' // reachable, but non-2xx (backend up, something wrong)
  | 'unreachable' // network failure — wrong origin, down, or CORS-blocked

export interface HealthResult {
  state: HealthState
  status?: number
}

/** Classify a fetch outcome. Pure, so the state machine is testable without a network. */
export function classifyHealth(outcome:
  | { ok: boolean; status: number }
  | { networkError: true }): HealthResult {
  if ('networkError' in outcome) return { state: 'unreachable' }
  if (outcome.ok) return { state: 'ok', status: outcome.status }
  return { state: 'error', status: outcome.status }
}

/** Probe the backend once. Never throws — a dead backend is a value, not an exception. */
export async function checkHealth(signal?: AbortSignal): Promise<HealthResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { signal })
    return classifyHealth({ ok: res.ok, status: res.status })
  } catch {
    return classifyHealth({ networkError: true })
  }
}
