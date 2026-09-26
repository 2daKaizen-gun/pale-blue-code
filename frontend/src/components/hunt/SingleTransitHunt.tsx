import { useCallback, useEffect, useState } from 'react'
import {
  monotransitCurve,
  monotransitHunt,
  type HuntDisposition,
  type MonotransitCurve,
  type MonotransitHunt,
  type MonotransitLedgerEntry,
  type MonotransitSurvivor,
  type PoolClassification,
} from '../../lib/api/monotransit'
import MonotransitCurveChart from './MonotransitCurveChart'
import EarthSizeDossier from './EarthSizeDossier'
import {
  DISCRIMINATOR_LABEL,
  DISPOSITION_ORDER,
  jupiterRadiusLabel,
  STAR_VERDICT,
  starVerdictSentence,
  survivorFollowUpBrief,
  survivorPeriodNote,
  survivorRecurrenceNote,
  survivorSizeNote,
  survivorTempNote,
} from './monotransitCopy'
import { SIZE_CLASS_CHIP, SIZE_CLASS_GLOSS } from './vocabulary'
import Spinner from '../ui/Spinner'

/**
 * Phase 11 — the single-transit hunt, as a self-contained block (extracted from the old
 * MonotransitHuntPage so the frontier front door can render the live hunt inline). One principle:
 * a first-time reader should understand it in three seconds, and every searched star should read
 * as ONE honest human sentence, with the evidence one layer below. A quiet star is a first-class
 * verdict — the dominant real outcome — never an absence dressed as a failure. The disk memo
 * (sub-11-12) makes this an instant read, which is what lets it sit on the entry page at all.
 *
 * 2026-08-07 — the three overlapping star lists (making-the-tool-legible §2: raw pool → planet-size
 * targets → searched stars) collapse into ONE filterable pool here. Every ledger entry already
 * carries both axes — a size class (행성 크기 표적 / 검출돼도 별) AND a hunt verdict — so the §2
 * table is just two filters over one list, not three separate pages. Each row expands to its
 * evidence (the honest drilldown), so a star's whole story reads without leaving the page.
 */

// Verdict chip colour per disposition — emerald only for a real candidate, calm greys for the rest.
const VERDICT_CHIP: Record<HuntDisposition, string> = {
  candidate: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300/90',
  rejected: 'border-cosmos-border bg-cosmos-surface text-cosmos-muted',
  held: 'border-amber-400/30 bg-amber-400/10 text-amber-200/80',
  insignificant: 'border-cosmos-border bg-cosmos-surface text-cosmos-muted',
  no_event: 'border-cosmos-border bg-cosmos-surface text-cosmos-subtle',
  not_fetched: 'border-cosmos-border bg-cosmos-surface text-cosmos-subtle',
}

// Size chip colour — emerald for a planet-size target (the prize), calm grey for the rest.
const SIZE_CHIP: Record<PoolClassification, string> = {
  plausible: 'border-emerald-400/30 bg-emerald-400/5 text-emerald-300/80',
  too_big: 'border-cosmos-border bg-cosmos-surface text-cosmos-subtle',
  unknown: 'border-cosmos-border bg-cosmos-surface text-cosmos-subtle',
}

// One evidence stat in an expanded row.
function EvidenceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] tracking-widest text-cosmos-subtle">{label}</dt>
      <dd className="font-mono text-xs text-cosmos-text">{value}</dd>
    </div>
  )
}

// One star, one honest sentence — now clickable to reveal the evidence one layer below (the
// drilldown). The row header carries BOTH axes: what a detection there would mean (size chip)
// and what the hunt actually found (verdict chip). Expanded, it shows the numbers behind the
// sentence — size, significance, detection floor — never jargon dressed as a conclusion.
function StarRow({ e }: { e: MonotransitLedgerEntry }) {
  const [open, setOpen] = useState(false)
  const [curve, setCurve] = useState<MonotransitCurve | null>(null)
  const [curveState, setCurveState] = useState<'idle' | 'loading' | 'error'>('idle')
  const size = e.size_class ?? 'unknown'
  const searched = e.disposition !== 'not_fetched'

  // The curve is heavy (thousands of points), so it loads only when a person asks to see it.
  const loadCurve = () => {
    if (curve || curveState === 'loading') return
    setCurveState('loading')
    monotransitCurve(e.planet_name)
      .then((c) => {
        setCurve(c)
        setCurveState('idle')
      })
      .catch(() => setCurveState('error'))
  }

  const floorPct = e.depth_floor != null && e.depth_floor > 0 ? `${(e.depth_floor * 100).toFixed(2)}%` : '—'
  // Significance read plainly: N sigma above the noise floor = "N times the noise" (2026-08-26).
  const sig = e.significance != null ? `잡음의 ${e.significance.toFixed(1)}배` : '—'
  const minR = e.min_planet_rjup != null ? jupiterRadiusLabel(e.min_planet_rjup, true) : '—'
  return (
    <li className="border-b border-cosmos-border/40 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-cosmos-elevated/40"
      >
        <span className="mt-0.5 flex shrink-0 flex-col items-start gap-1">
          <span
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-widest ${VERDICT_CHIP[e.disposition]}`}
          >
            {STAR_VERDICT[e.disposition]}
          </span>
          <span className={`rounded border px-2 py-0.5 font-mono text-[9px] tracking-widest ${SIZE_CHIP[size]}`}>
            {SIZE_CLASS_CHIP[size]}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-cosmos-text">{e.planet_name}</span>
            <span className="font-mono text-[10px] text-cosmos-subtle">{open ? '▾' : '▸'}</span>
          </span>
          <span className="mt-0.5 block text-sm text-cosmos-muted">{starVerdictSentence(e)}</span>
        </span>
      </button>
      {open && (
        <div className="mb-3 ml-1 border-l-2 border-cosmos-nebula/40 pl-4">
          <dl className="mb-2 flex flex-wrap gap-x-6 gap-y-1">
            <EvidenceStat label="크기 판정" value={SIZE_CLASS_CHIP[size]} />
            <EvidenceStat label="검출 시 최소" value={minR} />
            <EvidenceStat label="유의성" value={sig} />
            <EvidenceStat label="검출 바닥" value={floorPct} />
            <EvidenceStat label="밝기 꺼짐 횟수" value={String(e.n_events)} />
          </dl>
          <p className="text-xs text-cosmos-subtle">{SIZE_CLASS_GLOSS[size]}</p>
          {e.failed.length > 0 && (
            <p className="mt-1 text-xs text-cosmos-subtle">
              걸린 판별: {e.failed.map((f) => DISCRIMINATOR_LABEL[f] ?? f).join(', ')}
            </p>
          )}
          {searched && (
            <div className="mt-2">
              {!curve && curveState !== 'loading' && (
                <button
                  onClick={loadCurve}
                  className="font-mono text-[11px] text-cosmos-nebula hover:text-cosmos-text"
                >
                  {curveState === 'error' ? '광곡선 불러오기 실패 — 다시 시도 →' : '광곡선 보기 →'}
                </button>
              )}
              {curveState === 'loading' && (
                <p className="font-mono text-[11px] text-cosmos-subtle">광곡선 불러오는 중…</p>
              )}
              {curve && (
                <div className="mt-1 rounded border border-cosmos-border bg-cosmos-surface p-2">
                  <MonotransitCurveChart curve={curve} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

// A survivor — the rich evidence layer, only for a star that actually cleared every gate. Framed
// as a light-curve single-transit candidate (never "planet"), with its orbit portrait and the
// observer-frame follow-up brief. This is the "worth a human look" card.
function SurvivorCard({ s }: { s: MonotransitSurvivor }) {
  const plausible = s.size_class === 'plausible'
  const periodNote = survivorPeriodNote(s.min_period_days)
  const tempNote = survivorTempNote(s.max_eq_temp_k)
  const recurrenceNote = survivorRecurrenceNote(s.earliest_recurrence)
  const followUpBrief = survivorFollowUpBrief(
    s.epoch_bjd_tdb,
    s.depth_mmag,
    s.duration,
    s.earliest_recurrence,
  )
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
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
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
      <p className="mb-3 text-sm text-emerald-300/80">
        유의성과 네 판별을 모두 통과했습니다 — 사람이 직접 볼 가치가 있는 후보입니다.
      </p>
      <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-1">
        <Stat label="깊이" value={`${(s.depth * 100).toFixed(3)}%`} />
        <Stat label="유의성" value={s.significance != null ? `잡음의 ${s.significance.toFixed(1)}배` : '—'} />
        <Stat label="지속" value={`${(s.duration * 24).toFixed(1)}h`} />
        <Stat label="t0" value={`${s.t0.toFixed(2)} d`} />
      </dl>
      {(periodNote || tempNote || recurrenceNote) && (
        <div className="mb-3 space-y-1 border-l-2 border-cosmos-nebula/50 pl-3 text-xs text-cosmos-subtle">
          {periodNote && <p>{periodNote}</p>}
          {tempNote && <p>{tempNote}</p>}
          {recurrenceNote && <p>{recurrenceNote}</p>}
        </div>
      )}
      {followUpBrief && (
        <div className="mb-3 rounded border border-cosmos-border bg-cosmos-surface p-3">
          <p className="mb-1 font-mono text-[10px] tracking-widest text-cosmos-subtle">
            후속확인 브리핑 — 관측자 프레임
          </p>
          <p className="text-xs text-cosmos-subtle">{followUpBrief}</p>
        </div>
      )}
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

// The three-step "how it works", for a first-time reader — plain language, no jargon.
function HowItWorks() {
  const steps = [
    ['①', '진짜 별빛을 받아옵니다', '우주망원경 TESS가 실제로 찍은 밝기 곡선.'],
    ['②', '딱 한 번의 그림자를 찾습니다', '행성이 별 앞을 스칠 때 잠깐 어두워지는 그 한 번.'],
    ['③', '착시를 걸러냅니다', '계기 잡음·별 자체의 깜빡임을 네 가지로 솎아냅니다.'],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map(([n, title, body]) => (
        <div key={n} className="rounded-lg border border-cosmos-border bg-cosmos-surface p-3">
          <p className="text-sm text-cosmos-text">
            <span className="text-cosmos-nebula">{n}</span> {title}
          </p>
          <p className="mt-1 text-xs text-cosmos-subtle">{body}</p>
        </div>
      ))}
    </div>
  )
}

// The one pool, three filters — the §2 table made into a control. Each filter is a lens over the
// SAME list of stars, not a separate page: 살펴본 별 (we actually searched its light), 행성 크기
// 표적 (small enough a dip could be a planet), 전체 풀 (every frontier star). Default is the
// stars we searched — the honest, dominant view.
type PoolFilter = 'searched' | 'targets' | 'all'

const FILTER_LABEL: Record<PoolFilter, string> = {
  searched: '살펴본 별',
  targets: '행성 크기 표적',
  all: '전체 풀',
}

function matchesFilter(e: MonotransitLedgerEntry, f: PoolFilter): boolean {
  if (f === 'all') return true
  if (f === 'targets') return e.size_class === 'plausible'
  return e.disposition !== 'not_fetched' // 'searched'
}

/**
 * The live single-transit hunt: fetches the cached hunt, then renders the honest readout —
 * a one-line summary, the survivor cards worth a human look, and every star as one plain
 * sentence in a single filterable pool. Self-contained (its own data + loading + error), so it
 * drops into the frontier front door with no props.
 */
export default function SingleTransitHunt() {
  const [data, setData] = useState<MonotransitHunt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // the first request starts on mount
  const [filter, setFilter] = useState<PoolFilter>('searched')

  // State is only set in the request's callbacks, so the mount effect never
  // cascades a synchronous re-render; retry adds the visible reset.
  const load = useCallback(() => {
    monotransitHunt()
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

  const survivors = data?.survivors ?? []
  const ledger = data?.ledger ?? []
  // the pool under the active filter, sorted most-interesting-first (candidate down to quiet)
  const shown = ledger
    .filter((e) => matchesFilter(e, filter))
    .sort((a, b) => DISPOSITION_ORDER.indexOf(a.disposition) - DISPOSITION_ORDER.indexOf(b.disposition))
  const count = (f: PoolFilter) => ledger.filter((e) => matchesFilter(e, f)).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="mb-2 flex items-center gap-2 text-3xl font-semibold text-cosmos-text">
            <span aria-hidden>🛰️</span> 기계가 놓친 행성 찾기
          </h1>
          <p className="max-w-2xl text-sm text-cosmos-muted">
            자동 탐색 소프트웨어는 행성이 별 앞을 <em>여러 번 반복</em>해서 지나가야 알아챕니다.
            수백 일에 딱 한 번 스쳐 지나가는 먼 행성은 그래서 버려집니다. 우리는 바로 그
            <strong className="text-cosmos-text"> 한 번의 그림자</strong>
            <span className="text-cosmos-subtle">(천문학에서는 별 앞을 지나며 잠깐 어두워지는 이 현상을
            ‘트랜짓’이라 부릅니다)</span>를 찾습니다 — 기계가 눈먼 자리를요.
          </p>
        </div>
        <HowItWorks />
        <p className="max-w-2xl text-xs text-cosmos-subtle">
          살아남은 걸 <strong className="text-cosmos-muted">후보</strong>라고 부릅니다 — “행성을
          찾았다”가 <em>아니라</em>, “사람이 더 볼 가치가 있다”는 뜻입니다. 대부분의 별은 조용하고,
          그 조용함이 진짜 발견이 서 있을 바닥입니다.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-cosmos-muted">
          <Spinner /> 별들을 하나씩 살펴보는 중… (받아둔 별빛만, 조금 걸릴 수 있어요)
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
          <p className="text-lg text-cosmos-text">
            {data.searched === 0 ? (
              '아직 살펴본 별이 없습니다 — 먼저 별의 빛을 받아오세요.'
            ) : (
              <>
                진짜 별 {data.searched}개를 살펴봤습니다.{' '}
                {survivors.length > 0
                  ? `봐야 할 후보 ${survivors.length}개.`
                  : '봐야 할 후보는 아직 없습니다 — 모두 조용합니다.'}
              </>
            )}
          </p>

          {survivors.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-emerald-300/90">★ 봐야 할 후보</h2>
              {survivors.map((s) => (
                <SurvivorCard key={`${s.planet_name}-${s.t0}`} s={s} />
              ))}
            </section>
          )}

          {/* Decision D — how far our eye reached Earth size, from the ledger in hand. */}
          <EarthSizeDossier ledger={ledger} />

          {ledger.length > 0 && (
            <section>
              <h2 className="mb-1 text-sm font-semibold text-cosmos-text">
                하나의 풀 — 별마다 크기와 판정, 한 문장
              </h2>
              <p className="mb-3 text-xs text-cosmos-subtle">
                별 하나에 두 개의 딱지: <strong className="text-cosmos-muted">크기</strong>(밝기 꺼짐이
                검출되면 행성일 수 있나) 와 <strong className="text-cosmos-muted">판정</strong>(실제로
                무엇이 나왔나). 행을 누르면 그 근거가 펼쳐집니다.
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {(['searched', 'targets', 'all'] as PoolFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide transition-colors ${
                      filter === f
                        ? 'border-cosmos-nebula bg-cosmos-nebula/10 text-cosmos-text'
                        : 'border-cosmos-border bg-cosmos-surface text-cosmos-muted hover:border-cosmos-nebula/60'
                    }`}
                  >
                    {FILTER_LABEL[f]} <span className="text-cosmos-subtle">{count(f)}</span>
                  </button>
                ))}
              </div>
              {shown.length > 0 ? (
                <ul className="rounded-lg border border-cosmos-border bg-cosmos-surface px-4">
                  {shown.map((e) => (
                    <StarRow key={e.planet_name} e={e} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-cosmos-border bg-cosmos-surface px-4 py-6 text-center text-xs text-cosmos-subtle">
                  이 필터에 해당하는 별이 없습니다.
                </p>
              )}
              {filter !== 'all' && (
                <p className="mt-2 text-xs text-cosmos-subtle">
                  “전체 풀”에는 아직 빛을 받아오지 않은 별도 있습니다 — 도구는 보지 않은 곳을 봤다고
                  말하지 않습니다.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
