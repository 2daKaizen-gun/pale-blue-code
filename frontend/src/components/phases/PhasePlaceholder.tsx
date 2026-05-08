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

export default function PhasePlaceholder({ phase }: Props) {
  return (
    <div className="max-w-3xl">
      {/* 상단 메타 */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-cosmos-muted font-mono text-xs tracking-widest">
          PHASE {String(phase.number).padStart(2, '0')}
        </span>
        <span className={`font-mono text-xs tracking-wider ${STATUS_COLOR[phase.status]}`}>
          {STATUS_LABEL[phase.status]}
        </span>
      </div>

      {/* 헤더 */}
      <header className="mb-10">
        <div className="mb-3">
          <span className="text-4xl mr-3">{phase.emoji}</span>
          <span className="text-cosmos-text text-3xl font-semibold">
            {phase.title}
          </span>
        </div>
        <p className="text-cosmos-muted text-base">{phase.subtitle}</p>
      </header>

      {/* 질문 */}
      <section className="mb-10 p-6 rounded-lg bg-cosmos-surface border border-cosmos-border">
        <p className="text-cosmos-muted font-mono text-xs tracking-widest mb-2">
          THE QUESTION
        </p>
        <p className="text-cosmos-text text-lg leading-relaxed">
          {phase.question}
        </p>
      </section>

      {/* 진행 예정 메시지 */}
      {phase.status === 'planned' && (
        <div className="text-center py-12 text-cosmos-muted">
          <p className="text-sm font-mono tracking-widest mb-2">COMING SOON</p>
          <p className="text-xs">이 Phase는 아직 시작되지 않았어.</p>
        </div>
      )}

      {phase.status === 'in-progress' && (
        <div className="text-center py-12 text-cosmos-solar">
          <p className="text-sm font-mono tracking-widest mb-2">IN PROGRESS</p>
          <p className="text-xs text-cosmos-muted">
            지금 작업 중이야. 곧 콘텐츠가 추가될 거야.
          </p>
        </div>
      )}
    </div>
  )
}
