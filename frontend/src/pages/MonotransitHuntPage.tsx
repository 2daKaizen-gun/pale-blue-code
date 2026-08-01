import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  monotransitFetchPlan,
  monotransitHunt,
  type FetchPlan,
  type MonotransitHunt,
  type MonotransitLedgerEntry,
  type MonotransitSurvivor,
} from '../lib/api/monotransit'
import {
  DISCRIMINATOR_LABEL,
  DISPOSITION_LABEL,
  fetchPlanBestTarget,
  fetchPlanHeadline,
  fetchPlanPendingNote,
  huntHeadline,
  sensitivityCaption,
  sensitivityFloor,
  summarizeLedger,
  survivorSizeNote,
} from '../components/hunt/monotransitCopy'
import Spinner from '../components/ui/Spinner'

/**
 * Phase 11 — the single-transit hunt (sub-11-3 Light 4). The honest surface for the
 * frontier-pool monotransit hunt: survivors framed as *light-curve single-transit
 * candidates* (a lower bar than a TOI, never "planet"), and "searched, none survived"
 * shown as a first-class outcome, not an empty error. Reached via a separate link — NOT
 * added to constants/phases.ts, the same frontier/roadmap separation the nav keeps.
 */
function SurvivorCard({ s }: { s: MonotransitSurvivor }) {
  // sub-11-6: a plausible-star survivor (a detection here could be a planet) is the real prize —
  // highlighted; a too_big one is still shown but framed as star-sized, its card dimmed.
  const plausible = s.size_class === 'plausible'
  const cardBorder = plausible
    ? 'border-emerald-400/50'
    : s.size_class === 'too_big'
      ? 'border-cosmos-border opacity-80'
      : 'border-cosmos-nebula/50'
  const sizeChip = plausible
    ? 'bg-emerald-400/10 text-emerald-300/90'
    : 'bg-cosmos-surface text-cosmos-muted'
  return (
    <div className={`rounded-lg border bg-cosmos-elevated p-5 ${cardBorder}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-sm text-cosmos-text">{s.planet_name}</span>
        <span className="flex flex-wrap items-baseline gap-2">
          <span className={`rounded px-2 py-0.5 font-mono text-[10px] tracking-widest ${sizeChip}`}>
            {survivorSizeNote(s)}
          </span>
          <span className="rounded bg-cosmos-nebula/15 px-2 py-0.5 font-mono text-[10px] tracking-widest text-cosmos-nebula">
            단일 트랜짓 후보 · 행성 아님
          </span>
        </span>
      </div>
      <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-1">
        <Stat label="깊이" value={`${(s.depth * 100).toFixed(3)}%`} />
        <Stat label="유의성" value={s.significance != null ? s.significance.toFixed(1) + 'σ' : '—'} />
        <Stat label="지속" value={`${(s.duration * 24).toFixed(1)}h`} />
        <Stat label="t0" value={`${s.t0.toFixed(2)} d`} />
      </dl>
      <ul className="flex flex-wrap gap-2">
        {s.checks.map((c) => (
          <li
            key={c.name}
            className="rounded border border-cosmos-border px-2 py-0.5 font-mono text-[11px] text-emerald-300/90"
          >
            {DISCRIMINATOR_LABEL[c.name]?.split(' ')[0] ?? c.name} ✓
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] tracking-widest text-cosmos-subtle">{label}</dt>
      <dd className="font-mono text-sm text-cosmos-text">{value}</dd>
    </div>
  )
}

// Near-misses worth showing why: a significant dip a discriminator caught, or an event
// held for want of baseline. The "window into vetting" the four gates give, for lone events.
function LedgerRow({ e }: { e: MonotransitLedgerEntry }) {
  const reason =
    e.disposition === 'rejected' && e.failed.length
      ? e.failed.map((f) => DISCRIMINATOR_LABEL[f] ?? f).join(', ')
      : null
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-cosmos-border/50 py-2">
      <span className="font-mono text-xs text-cosmos-text">{e.planet_name}</span>
      <span className="font-mono text-[11px] text-cosmos-muted">
        {DISPOSITION_LABEL[e.disposition]}
        {e.significance != null && ` · ${e.significance.toFixed(1)}σ`}
        {reason && ` · ${reason}`}
      </span>
    </li>
  )
}

// sub-11-7: the targets. The hunt searches only cached curves, so before the result we name
// which plausible dwarfs are worth a fetch — how many are already searchable, how many still
// wait on their light — and state plainly that the pending ones need a local fetch.
function FetchPlanPanel({ plan }: { plan: FetchPlan }) {
  const s = plan.summary
  const best = fetchPlanBestTarget(s)
  const pendingNote = fetchPlanPendingNote(s)
  return (
    <section className="rounded-lg border border-cosmos-border bg-cosmos-surface p-5">
      <h2 className="mb-1 font-mono text-xs tracking-widest text-cosmos-subtle">
        표적 — 검출이 행성일 수 있는 별들 (sub-11-5 트리아지)
      </h2>
      <p className="text-sm text-cosmos-text">{fetchPlanHeadline(s)}</p>
      {best && <p className="mt-1 text-sm text-emerald-300/90">{best}</p>}
      {plan.targets.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {plan.targets.map((t) => (
            <li
              key={t.tic}
              className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                t.cached
                  ? 'border-emerald-400/40 text-emerald-300/90'
                  : 'border-cosmos-border text-cosmos-muted'
              }`}
            >
              {t.star_name}
              {t.min_planet_rjup != null && ` · ≥${t.min_planet_rjup.toFixed(2)}R♃`}
              {t.cached ? ' ✓' : ' ·미수집'}
            </li>
          ))}
        </ul>
      )}
      {pendingNote && (
        <p className="mt-3 border-l-2 border-cosmos-nebula/40 pl-3 text-xs text-cosmos-subtle">
          {pendingNote}
        </p>
      )}
    </section>
  )
}

export default function MonotransitHuntPage() {
  const [data, setData] = useState<MonotransitHunt | null>(null)
  const [plan, setPlan] = useState<FetchPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const run = () => {
    setLoading(true)
    setError(null)
    monotransitHunt()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  // the deterministic fetch plan loads alongside the hunt; a plan failure is non-fatal (the
  // hunt still renders), so it is swallowed rather than surfaced as the hunt's own error.
  useEffect(() => {
    monotransitFetchPlan()
      .then(setPlan)
      .catch(() => setPlan(null))
  }, [])

  useEffect(run, [])

  const survivors = data?.survivors ?? []
  // near-misses first (rejected/held), the empty dispositions never render a row
  const nearMisses = (data?.ledger ?? []).filter(
    (e) => e.disposition === 'rejected' || e.disposition === 'held',
  )
  // the detection floor the empty result rests on — what depth the hunt could have seen
  const floorCaption = data ? sensitivityCaption(sensitivityFloor(data.ledger)) : null

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
          FRONTIER · 기계가 놓친 곳
        </p>
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-semibold text-cosmos-text">
          <span aria-hidden>🛰️</span> 단일 트랜짓 사냥
        </h1>
        <p className="max-w-2xl text-sm text-cosmos-muted">
          자동 파이프라인은 딥이 <em>여러 번 반복</em>돼야 잡습니다. 한 구역에서 딱 한 번
          스치고 지나간 긴 주기 행성은 접을 것이 없어 버려집니다. 그 한 번의 통과를 겨눕니다 —
          유의성으로 한 번, 네 판별자로 다시 한 번 거른 뒤에도 살아남는 것만 후보로 부릅니다.
          대부분은 빈손이고, 그게 정직한 결과입니다. 살아남은 후보는 <em>검출됐을 때
          행성일 수 있는지</em>로 먼저 줄 세웁니다 — 거성에서 뜬 깊은 딥은 별이지 세계가
          아니니까요(sub-11-5의 트리아지).
        </p>
      </header>

      {plan && <FetchPlanPanel plan={plan} />}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-cosmos-muted">
          <Spinner /> 개척지 풀을 뒤지는 중… (캐시된 광곡선만, 시간이 걸릴 수 있어요)
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-200">
          <p className="mb-2">사냥을 실행하지 못했습니다 — {error}</p>
          <button onClick={run} className="font-mono text-xs text-cosmos-nebula hover:text-cosmos-text">
            다시 시도 →
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          <p className="text-lg text-cosmos-text">{huntHeadline(data.searched, survivors.length)}</p>

          <div className="flex flex-wrap gap-2">
            {summarizeLedger(data.ledger).map((c) => (
              <span
                key={c.disposition}
                className="rounded border border-cosmos-border bg-cosmos-surface px-2.5 py-1 font-mono text-[11px] text-cosmos-muted"
              >
                {c.label} <span className="text-cosmos-text">{c.count}</span>
              </span>
            ))}
          </div>

          {floorCaption && (
            <p className="border-l-2 border-cosmos-nebula/40 pl-3 text-xs text-cosmos-subtle">
              {floorCaption}
            </p>
          )}

          {survivors.length > 0 ? (
            <div className="flex flex-col gap-3">
              {survivors.map((s) => (
                <SurvivorCard key={`${s.planet_name}-${s.t0}`} s={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-cosmos-border bg-cosmos-surface p-6 text-sm text-cosmos-muted">
              살아남은 후보가 없습니다. 이건 실패가 아니라 결과입니다 — 이 풀의 별들은 애초에
              단일 트랜짓이 있어서 고른 게 아니니까요. 도구가 조용한 것, 그게 진짜 발견을 받쳐줄
              토대입니다.
            </div>
          )}

          {nearMisses.length > 0 && (
            <section>
              <h2 className="mb-2 font-mono text-xs tracking-widest text-cosmos-subtle">
                아깝게 걸러진 것들 — 왜 탈락했는지
              </h2>
              <ul className="rounded-lg border border-cosmos-border bg-cosmos-surface px-4">
                {nearMisses.map((e) => (
                  <LedgerRow key={e.planet_name} e={e} />
                ))}
              </ul>
            </section>
          )}
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
