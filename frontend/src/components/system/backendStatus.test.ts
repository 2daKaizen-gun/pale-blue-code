import { describe, it, expect } from 'vitest'
import { backendBanner } from './backendStatus'

/**
 * The banner exists so a broken deploy is *visible* instead of a page full of
 * silent empty states. Two things must hold: it stays quiet when things are fine
 * or still loading, and when several things are wrong it names the root cause
 * (a build misconfiguration) rather than the symptom it produces (unreachable).
 */

describe('backendBanner', () => {
  it('healthy backend → no banner', () => {
    expect(backendBanner({ misconfigured: false, reason: null, health: 'ok' })).toBeNull()
  })

  it('still probing (health null) → no banner yet', () => {
    expect(backendBanner({ misconfigured: false, reason: null, health: null })).toBeNull()
  })

  it('unreachable backend → error banner', () => {
    const b = backendBanner({ misconfigured: false, reason: null, health: 'unreachable' })
    expect(b?.tone).toBe('error')
    expect(b?.title).toMatch(/연결할 수 없/)
  })

  it('reachable but erroring → warn banner', () => {
    const b = backendBanner({ misconfigured: false, reason: null, health: 'error' })
    expect(b?.tone).toBe('warn')
  })

  it('misconfiguration wins over the unreachable symptom it causes', () => {
    const b = backendBanner({
      misconfigured: true,
      reason: 'VITE_API_BASE_URL is not set',
      health: 'unreachable',
    })
    expect(b?.title).toBe('백엔드 설정 오류')
    expect(b?.detail).toMatch(/VITE_API_BASE_URL/)
  })

  it('misconfigured with no reason still yields a helpful default', () => {
    const b = backendBanner({ misconfigured: true, reason: null, health: null })
    expect(b?.tone).toBe('error')
    expect(b?.detail.length).toBeGreaterThan(0)
  })
})
