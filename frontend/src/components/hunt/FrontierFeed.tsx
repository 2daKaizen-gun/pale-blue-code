import { useEffect, useState } from 'react'
import { frontierPool, type FrontierPool, type FrontierStar, type Mission } from '../../lib/api/hunt'
import { brightness, daysAgo, lightYears, warmth } from './starCopy'
import Spinner from '../ui/Spinner'

/**
 * "갓 내린 하늘" — the fresh-sky feed (Phase 10 sub-10-4). The frontier's answer to
 * "how would a non-expert ever pick a star?": instead of typing a TIC, browse the
 * newest TESS sector as a recency-sorted list of *real places in the sky* — where
 * each star sits, how bright it is, whether it's sun-like, and how recently TESS
 * observed it. The hook is time: this is the freshest data on a star that is still
 * absent from the TOI catalog. NB (nail #3): a bright unrecorded star has usually been
 * observed across many sectors, so we say "not yet flagged as a candidate," never
 * "never seen." Every field is stellar, never planetary, so the feed never hints at an
 * answer. Clicking a card hands its id (and identity) to the hunt.
 *
 * TESS only — Kepler has no dated pool, so the feed renders nothing there.
 */
interface Props {
  mission: Mission
  onPick: (tic: number, star: FrontierStar) => void
  busy: boolean
}

function StarCard({ star, onPick, busy }: { star: FrontierStar; onPick: Props['onPick']; busy: boolean }) {
  const d = daysAgo(star.observed_at)
  const warm = warmth(star.teff)
  const bright = brightness(star.tmag)
  const ly = lightYears(star.distance_pc)
  return (
    <button
      onClick={() => onPick(star.tic, star)}
      disabled={busy}
      className="flex flex-col gap-2 rounded-lg border border-cosmos-border bg-cosmos-surface p-4 text-left transition-colors hover:border-cosmos-nebula hover:bg-cosmos-elevated disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-sm text-cosmos-text">TIC {star.tic}</span>
        {d != null && (
          <span className="font-mono text-xs text-cosmos-nebula">{d}일 전 관측</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 text-xs text-cosmos-muted">
        {star.constellation && <span>🔭 {star.constellation} 방향</span>}
        {(warm || bright) && (
          <span>
            ✨ {[warm, bright].filter(Boolean).join(' · ')}
          </span>
        )}
        {ly != null && <span>📏 약 {ly.toLocaleString()}광년 거리</span>}
      </div>
      <span className="mt-1 font-mono text-xs text-cosmos-subtle">아직 후보로 지목되지 않았어요 →</span>
    </button>
  )
}

export default function FrontierFeed({ mission, onPick, busy }: Props) {
  const [pool, setPool] = useState<FrontierPool | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mission !== 'tess') return
    let live = true
    setLoading(true)
    setError(null)
    frontierPool('tess', 24)
      .then((p) => live && setPool(p))
      .catch((e) => live && setError(e instanceof Error ? e.message : '피드를 불러오지 못했습니다'))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [mission])

  if (mission !== 'tess') return null

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-cosmos-border bg-cosmos-surface p-5">
        <Spinner />
        <p className="font-mono text-xs text-cosmos-muted">갓 내린 하늘을 불러오는 중…</p>
      </div>
    )
  }

  if (error || !pool || pool.stars.length === 0) {
    // The feed is a bonus way in; if it fails, the picker below still works.
    return null
  }

  const built = pool.built_at ? pool.built_at.slice(0, 10) : null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 border-l-2 border-cosmos-nebula pl-3">
        <h2 className="text-lg font-semibold text-cosmos-text">
          갓 내린 하늘{pool.latest_sector != null && <span className="text-cosmos-muted"> — TESS 섹터 {pool.latest_sector}</span>}
        </h2>
        <p className="text-xs text-cosmos-muted">
          TESS 최신 섹터의 데이터로, 아직 어떤 행성 카탈로그(TOI)에도 오르지 않은 별들입니다. 하나를 골라 직접 판별해보세요.
          {built && <span className="text-cosmos-subtle"> · 마지막 갱신 {built}</span>}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pool.stars.map((s) => (
          <StarCard key={s.tic} star={s} onPick={onPick} busy={busy} />
        ))}
      </div>
    </section>
  )
}
