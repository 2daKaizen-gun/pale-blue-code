import type { HuntTarget } from '../../lib/api/hunt'

interface Props {
  target: HuntTarget
  onSelect: (kicId: number) => void
  disabled?: boolean
}

export default function HuntTargetCard({ target, onSelect, disabled }: Props) {
  return (
    <button
      onClick={() => onSelect(target.kic_id)}
      disabled={disabled}
      className="flex flex-col gap-2 rounded-lg border border-cosmos-border bg-cosmos-elevated p-5 text-left transition-colors hover:border-cosmos-nebula disabled:cursor-not-allowed disabled:opacity-40"
    >
      <p className="font-mono text-sm font-semibold tracking-wide text-cosmos-text">
        {target.label}
      </p>
      <p className="text-sm leading-relaxed text-cosmos-muted">{target.description}</p>
      <p className="mt-1 font-mono text-xs tracking-widest text-cosmos-nebula">
        {target.hint.toUpperCase()}
      </p>
    </button>
  )
}
