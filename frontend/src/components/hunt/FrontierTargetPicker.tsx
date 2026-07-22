import { useState } from 'react'
import { frontierRandom, type FrontierStar, type Mission } from '../../lib/api/hunt'
import Spinner from '../ui/Spinner'

interface Props {
  // star carries the enriched pick (TESS random) so the page can play a first-look
  // reveal; free input has no enrichment and omits it.
  onPick: (kicId: number, star?: FrontierStar | null) => void
  busy: boolean // a hunt is already running — lock both entry points
  mission: Mission // which sky (Kepler: KIC/KOI, TESS: TIC/TOI)
}

// Per-mission labels; the pick logic is identical (only the id namespace differs).
const LABELS: Record<Mission, { idLabel: string; catalog: string; example: string }> = {
  kepler: { idLabel: 'KIC', catalog: 'KOI', example: '8462852' },
  tess: { idLabel: 'TIC', catalog: 'TOI', example: '261136679' },
}

/**
 * Two ways into the frontier:
 *   1. Random unrecorded star — drawn from the pre-verified seed pool
 *      (backend guarantees it carries no catalog entry).
 *   2. Free input — any star id; the page's recorded gate decides whether it
 *      is huntable ground or already on file.
 * The picker only yields an id; the recorded check + hunt live on the page.
 */
export default function FrontierTargetPicker({ onPick, busy, mission }: Props) {
  const [manualKic, setManualKic] = useState('')
  const [randomLoading, setRandomLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const L = LABELS[mission]

  const drawRandom = async () => {
    setError(null)
    setRandomLoading(true)
    try {
      const pick = await frontierRandom(mission)
      onPick(pick.kic_id, pick.star)
    } catch (e) {
      setError(e instanceof Error ? e.message : '무작위 별을 뽑지 못했습니다')
    } finally {
      setRandomLoading(false)
    }
  }

  const submitManual = () => {
    const kic = Number(manualKic.trim())
    if (!Number.isInteger(kic) || kic <= 0) {
      setError(`유효한 ${L.idLabel} 번호를 입력하세요 (예: ${L.example})`)
      return
    }
    setError(null)
    onPick(kic)
  }

  const locked = busy || randomLoading

  return (
    <div className="flex flex-col gap-4">
      {/* Random unrecorded star */}
      <div className="flex flex-col gap-2 rounded-lg border border-cosmos-border bg-cosmos-surface p-5">
        <p className="font-mono text-xs tracking-widest text-cosmos-muted">
          무작위 미기록 별
        </p>
        <p className="text-sm text-cosmos-muted">
          {L.catalog} 카탈로그에 <span className="text-cosmos-text">항목이 없는</span> 별을
          하나 뽑습니다 — 아무도 후보로 올리지 않은 별. 대부분은 빈손이지만, 그것도 정직한 결과입니다.
        </p>
        <button
          onClick={drawRandom}
          disabled={locked}
          className="mt-1 flex items-center justify-center gap-2 self-start rounded-lg border border-cosmos-nebula bg-cosmos-elevated px-4 py-2 font-mono text-sm text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {randomLoading ? <Spinner /> : '🎲'} 미기록 별 뽑기
        </button>
      </div>

      {/* Free input */}
      <div className="flex flex-col gap-2 rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
        <p className="font-mono text-xs tracking-widest text-cosmos-muted">
          {L.idLabel} 직접 입력
        </p>
        <p className="text-sm text-cosmos-muted">
          찾고 싶은 별의 {L.idLabel} 번호를 입력하세요. 이미 기록된 별이면 정직하게 알려드립니다.
        </p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={manualKic}
            onChange={(e) => setManualKic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !locked && submitManual()}
            placeholder={`${L.idLabel} ${L.example}`}
            disabled={locked}
            className="w-full rounded-lg border border-cosmos-border bg-cosmos-bg px-3 py-2 font-mono text-sm text-cosmos-text placeholder:text-cosmos-subtle focus:border-cosmos-nebula focus:outline-none disabled:opacity-40 sm:w-56"
          />
          <button
            onClick={submitManual}
            disabled={locked || !manualKic.trim()}
            className="w-full rounded-lg border border-cosmos-nebula bg-cosmos-elevated px-4 py-2 font-mono text-sm text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            HUNT
          </button>
        </div>
      </div>

      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
