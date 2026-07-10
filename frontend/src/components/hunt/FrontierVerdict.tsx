import type { VettingReport } from '../../lib/api/hunt'
import VettingReportCard from './VettingReport'

interface Props {
  report: VettingReport
}

/**
 * Frames a vetting result in the frontier context (Phase 9-B), then renders the
 * unchanged 9-A report card beneath it. This page hunts only unrecorded stars, so
 * a `strong` verdict here is strong + unrecorded — the one place "후보(candidate)"
 * language is earned (honesty nail #3). `unlikely` is empty hands presented as a
 * result, never an error. No new vetting logic — pure framing over vetting.vet.
 */
const FRAME: Record<
  VettingReport['trust'],
  { ring: string; badge: string; kicker: string; body: string }
> = {
  strong: {
    ring: 'border-emerald-500/50 bg-emerald-500/10',
    badge: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300',
    kicker: '★ 우리가 찾은 신뢰 후보',
    body: '아무도 기록하지 않은 별에서 네 관문을 모두 통과한 신호를 찾았습니다. 확정된 행성이 아니라 신뢰할 만한 후보입니다 — 아래 판별 근거가 그 이유입니다. 개척지에서 이건 드문 순간입니다.',
  },
  weak: {
    ring: 'border-amber-500/50 bg-amber-500/10',
    badge: 'border-amber-400/50 bg-amber-500/10 text-amber-300',
    kicker: '애매 — 추가 검토 필요',
    body: '신호는 있지만 일부 관문에서 흐릿합니다. 후보라 부르기엔 이르고, 더 들여다봐야 합니다.',
  },
  unlikely: {
    ring: 'border-cosmos-border bg-cosmos-bg',
    badge: 'border-cosmos-subtle bg-cosmos-bg text-cosmos-muted',
    kicker: '빈손 — 그것도 답입니다',
    body: '이 별에는 행성이라 부를 신호가 없습니다. 노이즈이거나 쌍성입니다. 실패가 아니라 결과입니다 — "여기엔 행성이 없다"도 과학입니다. 개척은 원래 대부분 이렇습니다.',
  },
}

export default function FrontierVerdict({ report }: Props) {
  const frame = FRAME[report.trust]

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-lg border p-5 ${frame.ring}`}>
        <span
          className={`inline-block rounded border px-2 py-0.5 font-mono text-xs tracking-widest ${frame.badge}`}
        >
          {frame.kicker}
        </span>
        <p className="mt-3 text-sm text-cosmos-text">{frame.body}</p>
      </div>

      <VettingReportCard report={report} />
    </div>
  )
}
