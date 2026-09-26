import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { monotransitPool, type PoolAssessment, type PoolTarget } from '../lib/api/monotransit'
import { CLASSIFICATION_LABEL, minPlanetLabel, poolHeadline } from '../components/hunt/poolCopy'
import { SIZE_CLASS_CHIP } from '../components/hunt/vocabulary'
import Spinner from '../components/ui/Spinner'

/**
 * Phase 11 — where to point (sub-11-5 Light 4). Before a single fetch, ask what a detectable
 * dip would MEAN on each frontier-pool star: a transit depth maps to a companion radius, so the
 * detection floor becomes a minimum detectable planet radius. Most of the bright pool is giants
 * where that floor implies a star, not a planet — this page names that honestly and ranks the
 * few real targets first. Reached via a link — NOT added to constants/phases.ts.
 */
const CLASS_STYLE: Record<string, string> = {
  plausible: 'border-emerald-400/40 bg-emerald-400/5',
  too_big: 'border-cosmos-border bg-cosmos-surface opacity-70',
  unknown: 'border-cosmos-border bg-cosmos-surface opacity-50',
}

function TargetRow({ t, rank }: { t: PoolTarget; rank: number }) {
  return (
    <li
      className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded border px-3 py-2 ${
        CLASS_STYLE[t.classification] ?? ''
      }`}
    >
      <span className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-cosmos-subtle">{rank}</span>
        <span className="font-mono text-sm text-cosmos-text">TIC {t.tic}</span>
        {t.constellation && (
          <span className="font-mono text-[11px] text-cosmos-muted">{t.constellation}</span>
        )}
      </span>
      <span className="flex items-baseline gap-4">
        <span className="font-mono text-[11px] text-cosmos-subtle">
          R★ {t.stellar_radius != null ? `${t.stellar_radius.toFixed(2)}☉` : '—'}
        </span>
        <span className="font-mono text-xs text-cosmos-text">{minPlanetLabel(t)}</span>
        <span
          className={`font-mono text-[11px] ${
            t.classification === 'plausible' ? 'text-emerald-300/90' : 'text-cosmos-muted'
          }`}
        >
          {CLASSIFICATION_LABEL[t.classification]}
        </span>
      </span>
    </li>
  )
}

export default function PoolTargetsPage() {
  const [data, setData] = useState<PoolAssessment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // the first request starts on mount

  // State is only set in the request's callbacks, so the mount effect never
  // cascades a synchronous re-render; retry adds the visible reset.
  const load = useCallback(() => {
    monotransitPool()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const run = () => {
    setLoading(true)
    setError(null)
    load()
  }

  const targets = data?.targets ?? []

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
          FRONTIER · 어디를 겨눌까
        </p>
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-semibold text-cosmos-text">
          <span aria-hidden>🎯</span> 행성 크기 표적
        </h1>
        <p className="max-w-2xl text-sm text-cosmos-muted">
          트랜짓 깊이는 별의 원반에서 가려진 넓이 — 즉 동반체의 반지름을 말합니다 (R
          <sub>행성</sub> = √깊이 × R<sub>별</sub>). 그래서 <strong className="text-cosmos-text">별이
          작을수록</strong> 검출되는 밝기 꺼짐은 더 작은, 더 행성 같은 동반체를 뜻합니다. 개척지 풀은 이제
          이 사냥을 위해 <strong className="text-cosmos-text">작은 별부터</strong> 골라 담습니다
          (밝기순이 아니라). 그래서 대부분이 행성 크기 표적이고, 가장 작은 건 진짜 M 왜성이라 검출
          바닥이 지구 크기 행성까지 닿습니다. 아래는 별마다 그 최소 검출가능 행성 반지름입니다.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-cosmos-muted">
          <Spinner /> 풀을 평가하는 중…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-200">
          <p className="mb-2">풀을 불러오지 못했습니다 — {error}</p>
          <button onClick={run} className="font-mono text-xs text-cosmos-nebula hover:text-cosmos-text">
            다시 시도 →
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          <p className="border-l-2 border-cosmos-nebula/40 pl-3 text-lg text-cosmos-text">
            {poolHeadline(data.summary)}
          </p>

          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            <span className="rounded border border-emerald-400/40 bg-emerald-400/5 px-2.5 py-1 text-emerald-300/90">
              {SIZE_CLASS_CHIP.plausible} <span className="text-cosmos-text">{data.summary.plausible}</span>
            </span>
            <span className="rounded border border-cosmos-border bg-cosmos-surface px-2.5 py-1 text-cosmos-muted">
              {SIZE_CLASS_CHIP.too_big} <span className="text-cosmos-text">{data.summary.too_big}</span>
            </span>
            {data.summary.unknown > 0 && (
              <span className="rounded border border-cosmos-border bg-cosmos-surface px-2.5 py-1 text-cosmos-muted">
                {SIZE_CLASS_CHIP.unknown} <span className="text-cosmos-text">{data.summary.unknown}</span>
              </span>
            )}
          </div>

          <ul className="flex flex-col gap-1.5">
            {targets.map((t, i) => (
              <TargetRow key={t.tic} t={t} rank={i + 1} />
            ))}
          </ul>

          <p className="text-xs text-cosmos-subtle">
            바닥 깊이 {(data.summary.depth_floor * 100).toFixed(2)}% 기준, 행성/별 경계 목성 반지름의 {data.summary.planet_max_rjup}배.
            반지름은 크기만 말할 뿐 질량은 아닙니다 — 진짜 후보는 질량 확인이 더 필요합니다.
          </p>
        </>
      )}

      <p className="mt-2 text-xs text-cosmos-subtle">
        <Link to="/hunt/frontier" className="text-cosmos-nebula hover:text-cosmos-text">
          ← 개척지 허브로
        </Link>
      </p>
    </div>
  )
}
