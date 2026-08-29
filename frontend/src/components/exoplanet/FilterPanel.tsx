import type { Planet } from '../../lib/api/exoplanet'
import { getMethodColor } from './methodColor'

interface Props {
  methods: string[]
  selected: Set<string>
  onChange: (methods: Set<string>) => void
  planets: Planet[]
}

export default function FilterPanel({ methods, selected, onChange, planets }: Props) {
  const countByMethod = Object.fromEntries(
    methods.map((m) => [m, planets.filter((p) => p.discoverymethod === m).length])
  )

  const allSelected = methods.every((m) => selected.has(m))

  const toggle = (method: string) => {
    const next = new Set(selected)
    if (next.has(method)) next.delete(method)
    else next.add(method)
    onChange(next)
  }

  const toggleAll = () => onChange(allSelected ? new Set() : new Set(methods))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleAll}
        className="rounded border border-cosmos-border px-3 py-1 font-mono text-xs tracking-wider text-cosmos-muted transition-colors hover:text-cosmos-text"
      >
        {allSelected ? '전체 해제' : '전체 선택'}
      </button>
      {methods.map((method) => {
        const active = selected.has(method)
        const color = getMethodColor(method)
        return (
          <button
            key={method}
            onClick={() => toggle(method)}
            style={active ? { borderColor: color, color } : undefined}
            className={`rounded border px-3 py-1 font-mono text-xs tracking-wider transition-colors ${
              active
                ? 'bg-cosmos-surface'
                : 'border-cosmos-border text-cosmos-subtle hover:text-cosmos-muted'
            }`}
          >
            {method}
            <span className="ml-1.5 opacity-60">{countByMethod[method]}</span>
          </button>
        )
      })}
    </div>
  )
}
