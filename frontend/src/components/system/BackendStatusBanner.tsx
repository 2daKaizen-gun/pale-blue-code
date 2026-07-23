import { useEffect, useState } from 'react'
import { API_MISCONFIGURED, API_MISCONFIG_REASON } from '../../lib/api/base'
import { checkHealth, type HealthState } from '../../lib/api/health'
import { backendBanner } from './backendStatus'

/**
 * A thin shell over backendStatus.ts (pure, tested). On mount it probes the
 * backend once; combined with the build-time misconfiguration flag, it surfaces a
 * dismissible banner when the site's backend is unusable — so a broken deploy is
 * visible instead of a page of silent empty states. Renders nothing when healthy.
 */
export default function BackendStatusBanner() {
  const [health, setHealth] = useState<HealthState | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // A clean build with a misconfigured origin is a certainty — skip the probe
    // (it would just fail as "unreachable" and the misconfig message is better).
    if (API_MISCONFIGURED) return
    const ctrl = new AbortController()
    checkHealth(ctrl.signal).then((r) => setHealth(r.state))
    return () => ctrl.abort()
  }, [])

  const banner = backendBanner({
    misconfigured: API_MISCONFIGURED,
    reason: API_MISCONFIG_REASON,
    health,
  })

  if (!banner || dismissed) return null

  const toneCls =
    banner.tone === 'error'
      ? 'border-red-500/40 bg-red-950/40 text-red-100'
      : 'border-amber-500/40 bg-amber-950/40 text-amber-100'

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 border-b px-4 py-2.5 text-sm ${toneCls}`}
    >
      <span aria-hidden className="mt-0.5">
        {banner.tone === 'error' ? '⚠️' : '⚡'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{banner.title}</p>
        <p className="text-xs opacity-90">{banner.detail}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="알림 닫기"
        className="shrink-0 rounded px-1.5 text-current opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
