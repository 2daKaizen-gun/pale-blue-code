import { useEffect, useState } from 'react'
import {
  monotransitHunt,
  type HuntDisposition,
  type MonotransitHunt,
  type MonotransitLedgerEntry,
  type MonotransitSurvivor,
} from '../../lib/api/monotransit'
import {
  DISCRIMINATOR_LABEL,
  DISPOSITION_ORDER,
  STAR_VERDICT,
  starVerdictSentence,
  survivorFollowUpBrief,
  survivorPeriodNote,
  survivorRecurrenceNote,
  survivorSizeNote,
  survivorTempNote,
} from './monotransitCopy'
import Spinner from '../ui/Spinner'

/**
 * Phase 11 — the single-transit hunt, as a self-contained block (extracted from the old
 * MonotransitHuntPage so the frontier front door can render the live hunt inline). One principle:
 * a first-time reader should understand it in three seconds, and every searched star should read
 * as ONE honest human sentence, with the evidence one layer below. A quiet star is a first-class
 * verdict — the dominant real outcome — never an absence dressed as a failure. The disk memo
 * (sub-11-12) makes this an instant read, which is what lets it sit on the entry page at all.
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

// One star, one honest sentence. The heart of the readout: the plain-language verdict chip, the
// star's name, and the one sentence that says what we saw — jargon translated, quiet made honest.
function StarRow({ e }: { e: MonotransitLedgerEntry }) {
  return (
    <li className="flex items-start gap-3 border-b border-cosmos-border/40 py-3 last:border-0">
      <span
        className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] tracking-widest ${VERDICT_CHIP[e.disposition]}`}
      >
        {STAR_VERDICT[e.disposition]}
      </span>
      <div className="min-w-0">
        <div className="font-mono text-xs text-cosmos-text">{e.planet_name}</div>
        <p className="mt-0.5 text-sm text-cosmos-muted">{starVerdictSentence(e)}</p>
      </div>
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
        <Stat label="유의성" value={s.significance != null ? s.significance.toFixed(1) + 'σ' : '—'} />
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

/**
 * The live single-transit hunt: fetches the cached hunt, then renders the honest readout —
 * a one-line summary, the survivor cards worth a human look, and every searched star as one
 * plain sentence. Self-contained (its own data + loading + error), so it drops into the
 * frontier front door with no props.
 */
export default function SingleTransitHunt() {
  const [data, setData] = useState<MonotransitHunt | null>(null)
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

  useEffect(run, [])

  const survivors = data?.survivors ?? []
  const ledger = data?.ledger ?? []
  // every star the hunt actually looked at — sorted most-interesting-first (candidate down to quiet)
  const searched = ledger
    .filter((e) => e.disposition !== 'not_fetched')
    .sort((a, b) => DISPOSITION_ORDER.indexOf(a.disposition) - DISPOSITION_ORDER.indexOf(b.disposition))
  const notFetched = ledger.filter((e) => e.disposition === 'not_fetched').length

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
            <strong className="text-cosmos-text"> 한 번의 그림자</strong>를 찾습니다 — 기계가 눈먼
            자리를요.
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

          {searched.length > 0 && (
            <section>
              <h2 className="mb-1 text-sm font-semibold text-cosmos-text">
                살펴본 별 — 하나에 한 문장
              </h2>
              <p className="mb-2 text-xs text-cosmos-subtle">
                각 별에서 무엇을 봤는지, 그리고 왜 그렇게 판정했는지.
              </p>
              <ul className="rounded-lg border border-cosmos-border bg-cosmos-surface px-4">
                {searched.map((e) => (
                  <StarRow key={e.planet_name} e={e} />
                ))}
              </ul>
            </section>
          )}

          {notFetched > 0 && (
            <p className="border-l-2 border-cosmos-nebula/40 pl-3 text-xs text-cosmos-subtle">
              아직 빛을 받아오지 않은 별이 {notFetched}개 있습니다 — 로컬에서 받아와야 볼 수
              있습니다. 도구는 보지 않은 곳을 봤다고 말하지 않습니다.
            </p>
          )}
        </>
      )}
    </div>
  )
}
