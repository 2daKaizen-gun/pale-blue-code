import type { CheckName, VettingCheck, VettingReport } from '../../lib/api/hunt'

interface Props {
  report: VettingReport
}

// Backend returns numbers + pass/fail; the plain-language explanation lives here
// (KOIMatchCard precedent). Honesty rule (PRD §7): never assert "confirmed planet".
const GATE_LABEL: Record<CheckName, string> = {
  odd_even: '홀·짝 깊이',
  secondary: '반대편 검사',
  shape: '어두워짐 모양',
  size: '크기와 신호',
}

const COPY: Record<CheckName, { pass: string; fail: string }> = {
  odd_even: {
    pass: '홀수번째와 짝수번째 어두워짐의 깊이가 같습니다. 매번 같은 것이 별 앞을 지나갔다는 뜻 — 행성다움.',
    fail: '홀·짝 깊이가 다릅니다. 서로 다른 두 별이 번갈아 가린 흔적일 수 있어요 — 쌍성 의심.',
  },
  secondary: {
    pass: '행성 반대편에서 추가로 어두워지지 않습니다. 동반체가 스스로 빛나지 않는다는 뜻 — 행성다움.',
    fail: '반대편에서도 어두워집니다. 스스로 빛나는 동반성 — 행성이 아니라 별일 수 있어요.',
  },
  shape: {
    pass: '어두워짐의 바닥이 평평합니다(U자). 온전한 원반이 별 앞을 가로질렀어요 — 행성다움.',
    fail: '바닥이 뾰족합니다(V자). 스치듯 지나간 쌍성일 수 있어요.',
  },
  size: {
    pass: '신호가 선명하고 추정 크기가 행성 범위 안입니다.',
    fail: '추정 크기가 항성급이거나 신호가 약합니다 — 행성이라기엔 무리.',
  },
}

// "insignificant" never reaches this map — it is handled by an early return before
// the gate list, since no gate ran (nail 5). The other three read here as before.
const TRUST: Record<
  Exclude<VettingReport['trust'], 'insignificant'>,
  { ring: string; badge: string; label: string; line: string }
> = {
  strong: {
    ring: 'border-emerald-500/50 bg-emerald-500/10',
    badge: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300',
    label: '신뢰할 만한 후보',
    line: '네 검사를 모두 통과했습니다 — 행성 후보로서 신뢰할 만합니다.',
  },
  weak: {
    ring: 'border-amber-500/50 bg-amber-500/10',
    badge: 'border-amber-400/50 bg-amber-500/10 text-amber-300',
    label: '검토 필요',
    line: '일부 검사에서 애매합니다 — 후보이지만 추가 검토가 필요합니다.',
  },
  unlikely: {
    ring: 'border-cosmos-border bg-cosmos-bg',
    badge: 'border-cosmos-subtle bg-cosmos-bg text-cosmos-muted',
    label: '행성 아닐 가능성 높음',
    line: '쌍성·위양성 가능성이 높습니다 — 후보로 보고하지 않는 것을 권합니다.',
  },
}

function metricHint(check: VettingCheck): string | null {
  const m = check.metrics
  const f = (v: number | undefined, d = 4) => (v === undefined ? '—' : v.toFixed(d))
  switch (check.name) {
    case 'odd_even':
      return `홀수 통과 깊이 ${f(m.depth_odd)} · 짝수 통과 깊이 ${f(m.depth_even)} · 차이 잡음의 ${f(m.sigma, 1)}배`
    case 'secondary':
      return `2차 깊이 ${f(m.sec_depth)} · S/N ${f(m.sec_snr, 1)}`
    case 'shape':
      return `평평한 바닥 비율 ${f(m.flat_frac, 2)}`
    case 'size':
      return `신호세기 S/N ${f(m.snr, 1)} · 상대크기 Rp/Rs ${f(m.rp_rs, 3)}`
    default:
      return null
  }
}

// Nail 5 (Phase 11) — the window into the *precondition*, shown even when the signal
// cleared it. Before the four gates judged shape, we asked whether this was a real
// detection at all; this says how firmly it passed that bar. Not a black box (sub-9-2
// inheritance): the very number that let this signal onto the vetting table is put on
// the table. `significance == null` means a lone observed transit — no transit-to-
// transit consistency to measure, so the question was held (sub-11-2+ owns it).
function significanceNote(report: VettingReport): { label: string; body: string } {
  if (report.significance == null) {
    return {
      label: '검출 유의성 — 보류',
      body: '관측된 통과가 하나뿐이라 트랜짓 사이의 일관성을 잴 수 없었습니다 — 유의성 판단은 보류하고 네 관문으로 넘어갔습니다. 단일 통과의 유의성은 다음 단계(단일 트랜짓 탐지)의 몫입니다.',
    }
  }
  return {
    label: '검출 유의성 — 통과',
    body: `이 봉우리는 트랜짓마다 같은 깊이로 어두워져, 잡음의 ${report.significance.toFixed(1)}배 크기로 솟았습니다 — 감식대에 올릴 만한 진짜 검출입니다. 그래서 네 관문을 돌렸고, 아래 판정은 그 위에서 내린 것입니다.`,
  }
}

// The de-aliasing teaching note: BLS often locks onto a ½×/2×/4× harmonic; the
// gates recover the true period first, so we show the correction as a "window".
function aliasNote(report: VettingReport): string | null {
  if (Math.abs(report.alias_factor - 1) < 1e-6) return null
  const f = report.alias_factor
  const rel = f > 1 ? `${Math.round(f)}배` : `1/${Math.round(1 / f)}배`
  return `주기 신호 탐색기(BLS)는 ${report.bls_period.toFixed(3)}일 신호에 반응했지만, 반복 구조가 진짜 주기는 그 ${rel}인 ${report.period.toFixed(3)}일임을 드러냈습니다 — 이 진짜 주기 위에서 판별했습니다.`
}

// Nail 4 — a wide sky is seen shallowly. TESS watches ~27 days per sector, so the
// gates (which rest on repeated transits) can be blunt. We say how much we saw and,
// when a `strong` was earned on too few transits, mark it provisional. The gate
// math and the verdict are untouched; this is only how much we trust them.
const ID_LABEL: Record<VettingReport['mission'], string> = { kepler: 'KIC', tess: 'TIC' }

function Footprint({ report }: Props) {
  const idLabel = ID_LABEL[report.mission] ?? 'KIC'
  const cells: { label: string; value: string }[] = [
    { label: '관측선', value: `${report.baseline_days.toFixed(1)}일` },
    // an actual count of transits with data, so no "~" hedge — a long baseline with
    // sparse coverage (TESS revisits) shows the few transits we really saw.
    { label: '실제 통과', value: `${report.transit_count}회` },
  ]
  if (report.sector_count != null) {
    cells.push({ label: 'TESS 구역', value: `${report.sector_count}개` })
  }
  return (
    <div className="mb-4 rounded border border-cosmos-subtle bg-cosmos-surface p-3">
      <p className="font-mono text-xs tracking-widest text-cosmos-muted">
        얼마나 보았나 — {report.mission.toUpperCase()}
      </p>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {cells.map((c) => (
          <div key={c.label} className="flex flex-col">
            <dt className="font-mono text-[10px] tracking-widest text-cosmos-subtle">{c.label}</dt>
            <dd className="font-mono text-sm text-cosmos-text">{c.value}</dd>
          </div>
        ))}
      </dl>
      {report.provisional && (
        <p className="mt-2 text-xs text-amber-300/90">
          관측선이 짧아 통과를 몇 번밖에 보지 못했습니다 — 홀·짝과 반대편 검사가 무뎌질 수 있어,
          강한 신호라도 <span className="font-semibold">잠정(provisional)</span>으로 낮춰 표시합니다.
          판정 자체는 그대로입니다.
        </p>
      )}
      <p className="mt-1 font-mono text-[10px] text-cosmos-subtle">
        얕게 본 하늘일수록 확신은 겸손해야 합니다 (nail 4) · {idLabel} {report.kic_id}
      </p>
    </div>
  )
}

// Nail 5 — a signal that did not clear the significance precondition never reached the
// four gates, so there is no gate list to show. Report why it stopped instead: this is
// the window into the vetting for the case where vetting never began.
function InsignificantCard({ report }: Props) {
  const idLabel = ID_LABEL[report.mission] ?? 'KIC'
  const sig = report.significance
  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
      <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
        VETTING — {idLabel} {report.kic_id}
      </p>
      <p className="mb-1 text-lg font-semibold text-cosmos-text">
        먼저 물었습니다 — 이게 진짜 검출인가?
      </p>
      <p className="mb-4 text-sm text-cosmos-muted">
        {report.period.toFixed(3)}일 주기 신호를 네 관문에 올리기 전에, 애초에 실재하는
        검출인지부터 확인합니다. 모양을 심문하는 건 그다음입니다.
      </p>

      <Footprint report={report} />

      <div className="rounded-lg border border-cosmos-border bg-cosmos-bg p-4">
        <span className="inline-block rounded border border-cosmos-subtle bg-cosmos-bg px-2 py-0.5 font-mono text-xs tracking-widest text-cosmos-muted">
          NO DETECTION
        </span>
        <p className="mt-2 text-sm text-cosmos-text">
          트랜짓마다 깊이가 제각각이라 — 진짜 행성은 매번 똑같이 어두워집니다 — 이 봉우리는
          광도곡선의 잡음 바닥과 구별되지 않았습니다
          {sig != null && ` (트랜짓 사이 신호 세기 = 잡음의 ${sig.toFixed(1)}배)`}. 감식할 지문이 아니라
          번진 얼룩이었습니다. 그래서 네 관문은 돌리지 않았습니다 — 없는 신호를 판별할
          수는 없으니까요. 실패가 아니라 정직한 결과입니다.
        </p>
      </div>
    </div>
  )
}

export default function VettingReportCard({ report }: Props) {
  if (report.trust === 'insignificant') return <InsignificantCard report={report} />

  const trust = TRUST[report.trust]
  const alias = aliasNote(report)
  const sig = significanceNote(report)

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
      <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
        VETTING — {ID_LABEL[report.mission] ?? 'KIC'} {report.kic_id}
      </p>
      <p className="mb-1 text-lg font-semibold text-cosmos-text">
        이 신호를 네 가지로 심문했습니다
      </p>
      <p className="mb-4 text-sm text-cosmos-muted">
        {report.period.toFixed(3)}일 주기 신호가 행성다운지, 아니면 쌍성·노이즈인지 하나씩 확인합니다.
        {' '}
        {report.passed_count}/{report.total} 통과.
      </p>

      {alias && (
        <div className="mb-4 rounded border border-cosmos-subtle bg-cosmos-surface p-3">
          <p className="font-mono text-xs tracking-widest text-cosmos-nebula">주기 교정</p>
          <p className="mt-1 text-sm text-cosmos-text">{alias}</p>
        </div>
      )}

      {/* Nail 5 — the precondition that ran before the gates, shown so the verdict
          is not a black box: this is why the signal earned a place on the table. */}
      <div className="mb-4 rounded border border-cosmos-subtle bg-cosmos-surface p-3">
        <p className="font-mono text-xs tracking-widest text-cosmos-nebula">{sig.label}</p>
        <p className="mt-1 text-sm text-cosmos-text">{sig.body}</p>
      </div>

      <Footprint report={report} />

      <ul className="flex flex-col gap-3">
        {report.checks.map((check) => {
          const copy = COPY[check.name]
          const hint = metricHint(check)
          return (
            <li
              key={check.name}
              className="flex gap-3 rounded border border-cosmos-border bg-cosmos-bg p-3"
            >
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-sm ${
                  check.passed
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                }`}
              >
                {check.passed ? '✓' : '✗'}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-cosmos-text">
                    {GATE_LABEL[check.name]}
                  </span>
                  {!check.passed && check.hard && (
                    <span className="rounded border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-amber-300">
                      HARD
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-cosmos-muted">
                  {check.passed ? copy.pass : copy.fail}
                </p>
                {hint && <p className="mt-1 font-mono text-xs text-cosmos-subtle">{hint}</p>}
              </div>
            </li>
          )
        })}
      </ul>

      <div className={`mt-4 rounded-lg border p-4 ${trust.ring}`}>
        <span
          className={`inline-block rounded border px-2 py-0.5 font-mono text-xs tracking-widest ${trust.badge}`}
        >
          {report.provisional ? `PROVISIONAL · ${trust.label}` : trust.label}
        </span>
        <p className="mt-2 text-sm text-cosmos-text">
          {report.provisional
            ? '네 검사를 모두 통과했지만, 관측선이 짧아 통과를 몇 번밖에 보지 못했습니다 — 신뢰할 만한 잠정 후보입니다. 더 긴 관측이 이 확신을 굳혀줄 것입니다.'
            : trust.line}
        </p>
      </div>
    </div>
  )
}
