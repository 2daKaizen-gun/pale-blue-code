import type { HuntStats } from '../../lib/huntLog'

interface Props {
  stats: HuntStats
  onClear?: () => void
}

/**
 * The frontier's honest tally (9B-PLAN §3-3). It shows "N번 사냥, 후보 M" and,
 * when the hunt has produced only empty hands, says so as a fact — "개척은 원래
 * 이렇다" — never as a failure. The candidate count is the only figure allowed
 * to celebrate, and only because a frontier `strong` is strong + unrecorded, the
 * earned "후보" (honesty nail #3). Gate rejections (recorded / no-lc) are shown
 * apart from the hunt count so the denominator stays honest.
 */
export default function HuntLog({ stats, onClear }: Props) {
  const { hunts, candidates, emptyHands, weak, recorded, noLc } = stats

  // Nothing hunted and nothing turned away yet — no tally to show.
  if (hunts === 0 && recorded === 0 && noLc === 0) return null

  const gateRejections = recorded + noLc

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cosmos-border bg-cosmos-surface p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs tracking-widest text-cosmos-muted">사냥 기록</p>
        {onClear && (
          <button
            onClick={onClear}
            className="font-mono text-xs text-cosmos-subtle transition-colors hover:text-cosmos-muted"
          >
            기록 지우기
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <Figure value={hunts} label="번 사냥" />
        <Figure
          value={candidates}
          label="후보"
          highlight={candidates > 0}
        />
        <Figure value={emptyHands} label="빈손" muted />
        {weak > 0 && <Figure value={weak} label="애매" muted />}
      </div>

      <p className="text-sm text-cosmos-muted">
        {candidates > 0 ? (
          <>
            신뢰 후보 <span className="text-emerald-300">{candidates}건</span> — 개척지에서 드문
            순간입니다. 판별 근거와 함께 발견 기록으로 남기세요.
          </>
        ) : hunts > 0 ? (
          <>
            아직 빈손입니다 — <span className="text-cosmos-text">개척은 원래 이렇습니다.</span> 대부분의
            별에는 행성이 없고, "여기엔 없다"도 정직한 결과입니다.
          </>
        ) : (
          <>아직 사냥한 별이 없습니다.</>
        )}
      </p>

      {gateRejections > 0 && (
        <p className="font-mono text-xs text-cosmos-subtle">
          그 외 {recorded > 0 && <>이미 기록됨 {recorded}</>}
          {recorded > 0 && noLc > 0 && ' · '}
          {noLc > 0 && <>광도곡선 없음 {noLc}</>} — 사냥 전에 걸러진 별들 (사냥 횟수에 미포함)
        </p>
      )}
    </div>
  )
}

function Figure({
  value,
  label,
  highlight = false,
  muted = false,
}: {
  value: number
  label: string
  highlight?: boolean
  muted?: boolean
}) {
  const tone = highlight ? 'text-emerald-300' : muted ? 'text-cosmos-muted' : 'text-cosmos-text'
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`font-mono text-2xl font-semibold ${tone}`}>{value}</span>
      <span className="text-xs text-cosmos-muted">{label}</span>
    </span>
  )
}
