import { Link } from 'react-router-dom'
import type { Phase } from '../../constants/phases'

interface Props {
  phase: Phase
}

const STATUS_LABEL: Record<Phase['status'], string> = {
  'done':         '✓ DONE',
  'in-progress':  '◐ IN PROGRESS',
  'planned':      '○ PLANNED',
}

const STATUS_COLOR: Record<Phase['status'], string> = {
  'done':         'text-cosmos-aurora',
  'in-progress':  'text-cosmos-solar',
  'planned':      'text-cosmos-subtle',
}

export default function PhaseCard({ phase }: Props) {
  return (
    <Link
      to={phase.path}
      className="
        group block p-5 rounded-lg
        bg-cosmos-surface border border-cosmos-border
        hover:border-cosmos-nebula hover:bg-cosmos-elevated
        transition-all
      "
    >
      {/* 상단: Phase 번호 + 상태 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-cosmos-muted font-mono text-xs tracking-widest">
          PHASE {String(phase.number).padStart(2, '0')}
        </span>
        <span className={`font-mono text-xs tracking-wider ${STATUS_COLOR[phase.status]}`}>
          {STATUS_LABEL[phase.status]}
        </span>
      </div>

      {/* 이모지 + 제목 */}
      <div className="mb-3">
        <span className="text-2xl mr-2">{phase.emoji}</span>
        <span className="text-cosmos-text text-lg font-semibold">
          {phase.title}
        </span>
        <span className="text-cosmos-muted text-sm ml-2">
          — {phase.subtitle}
        </span>
      </div>

      {/* 질문 */}
      <p className="text-cosmos-muted text-sm leading-relaxed group-hover:text-cosmos-text transition-colors">
        {phase.question}
      </p>
    </Link>
  )
}
