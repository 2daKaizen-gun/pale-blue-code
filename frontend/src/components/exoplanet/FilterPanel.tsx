import type { Planet } from '../../lib/api/exoplanet'

export const METHOD_COLOR: Record<string, string> = {
  Transit: '#818cf8',
  'Radial Velocity': '#34d399',
  Imaging: '#fbbf24',
  Microlensing: '#f87171',
  Astrometry: '#38bdf8',
}

export function getMethodColor(method: string): string {
  return METHOD_COLOR[method] ?? '#64748b'
}

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
        {allSelected ? 'NONE' : 'ALL'}
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
