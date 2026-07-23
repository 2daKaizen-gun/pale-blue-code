import { describe, it, expect, vi, afterEach } from 'vitest'
import { classifyHealth, checkHealth } from './health'

/**
 * The banner's honesty depends on telling three states apart: a reachable healthy
 * backend, a reachable-but-broken one, and one we cannot reach at all (the failure
 * that hid the whole broken deploy). classifyHealth is the pure state machine;
 * checkHealth wires it to fetch and must never throw on a network failure.
 */

describe('classifyHealth', () => {
  it('200 → ok', () => {
    expect(classifyHealth({ ok: true, status: 200 })).toEqual({ state: 'ok', status: 200 })
  })
  it('reachable non-2xx → error (backend up, wrong answer)', () => {
    expect(classifyHealth({ ok: false, status: 500 })).toEqual({ state: 'error', status: 500 })
  })
  it('network failure → unreachable (no status)', () => {
    expect(classifyHealth({ networkError: true })).toEqual({ state: 'unreachable' })
  })
})

describe('checkHealth', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('maps a 200 response to ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    expect(await checkHealth()).toEqual({ state: 'ok', status: 200 })
  })

  it('swallows a thrown fetch (down / CORS) as unreachable, never throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(checkHealth()).resolves.toEqual({ state: 'unreachable' })
  })

  it('a non-ok response is error, not unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    expect(await checkHealth()).toEqual({ state: 'error', status: 503 })
  })
})
