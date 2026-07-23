import { describe, it, expect } from 'vitest'
import { resolveApiConfig, LOCAL_DEFAULT } from './apiConfig'

/**
 * Pale Blue Code — live-site revival hardening.
 *
 * The one invariant these tests pin: a *production* build must never silently
 * accept a backend origin it cannot reach. That precise slip — VITE_API_BASE_URL
 * unset on Vercel, so the deployed bundle fetched localhost:8000 — took the whole
 * hosted site offline without a single error. So the rule is asymmetric on purpose:
 * localhost is correct in dev and a misconfiguration in prod.
 */

describe('resolveApiConfig', () => {
  it('dev + no override → local default, not flagged', () => {
    const c = resolveApiConfig({ raw: undefined, prod: false })
    expect(c.baseUrl).toBe(LOCAL_DEFAULT)
    expect(c.misconfigured).toBe(false)
    expect(c.reason).toBeNull()
  })

  it('prod + no override → still falls back but IS flagged (the real bug)', () => {
    const c = resolveApiConfig({ raw: undefined, prod: true })
    expect(c.baseUrl).toBe(LOCAL_DEFAULT)
    expect(c.misconfigured).toBe(true)
    expect(c.reason).toMatch(/VITE_API_BASE_URL/)
  })

  it('prod + explicit localhost → flagged (a hosted page cannot reach localhost)', () => {
    for (const raw of [
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'https://0.0.0.0:9000',
    ]) {
      const c = resolveApiConfig({ raw, prod: true })
      expect(c.misconfigured).toBe(true)
      expect(c.baseUrl).toBe(raw)
    }
  })

  it('prod + real hosted URL → clean', () => {
    const c = resolveApiConfig({ raw: 'https://api.example.up.railway.app', prod: true })
    expect(c.baseUrl).toBe('https://api.example.up.railway.app')
    expect(c.misconfigured).toBe(false)
    expect(c.reason).toBeNull()
  })

  it('trims surrounding whitespace', () => {
    const c = resolveApiConfig({ raw: '  https://api.example.app  ', prod: true })
    expect(c.baseUrl).toBe('https://api.example.app')
    expect(c.misconfigured).toBe(false)
  })

  it('does not confuse a hosted host that merely contains digits', () => {
    // '127' appearing inside a real hostname must not trip the localhost guard.
    const c = resolveApiConfig({ raw: 'https://backend-127x.up.railway.app', prod: true })
    expect(c.misconfigured).toBe(false)
  })

  it('dev + explicit localhost → fine (the normal local setup)', () => {
    const c = resolveApiConfig({ raw: 'http://localhost:8000', prod: false })
    expect(c.misconfigured).toBe(false)
  })
})
