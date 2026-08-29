import { useState, useMemo } from 'react'
import type { Planet } from '../../lib/api/exoplanet'

interface Props {
  planets: Planet[]
  onSelect: (planet: Planet) => void
}

type SortKey = keyof Pick<
  Planet,
  'pl_name' | 'hostname' | 'discoverymethod' | 'disc_year' | 'pl_rade' | 'pl_masse' | 'pl_orbper'
>
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

const COLS: { key: SortKey; label: string; decimals?: number }[] = [
  { key: 'pl_name', label: '행성' },
  { key: 'hostname', label: '모항성' },
  { key: 'discoverymethod', label: '발견 방법' },
  { key: 'disc_year', label: '발견 연도' },
  { key: 'pl_rade', label: '반지름 (지구=1)', decimals: 2 },
  { key: 'pl_masse', label: '질량 (지구=1)', decimals: 2 },
  { key: 'pl_orbper', label: '공전 주기 (일)', decimals: 3 },
]

function fmt(v: number | string | null | undefined, decimals = 2): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v
  return v.toFixed(decimals)
}

export default function PlanetTable({ planets, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('pl_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  const searched = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return planets
    return planets.filter(
      (p) => p.pl_name.toLowerCase().includes(q) || p.hostname.toLowerCase().includes(q)
    )
  }, [planets, query])

  const sorted = useMemo(() => {
    return [...searched].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [searched, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const rows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const handleQuery = (q: string) => {
    setQuery(q)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder="Search planet or host star..."
          className="w-72 rounded border border-cosmos-border bg-cosmos-surface px-3 py-2 text-sm text-cosmos-text placeholder-cosmos-muted focus:border-cosmos-nebula focus:outline-none"
        />
        <span className="font-mono text-xs text-cosmos-muted">
          {searched.length.toLocaleString()} results
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cosmos-border">
              {COLS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left font-mono text-xs tracking-wider text-cosmos-muted hover:text-cosmos-text"
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1 text-cosmos-nebula">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((planet) => (
              <tr
                key={planet.pl_name}
                onClick={() => onSelect(planet)}
                className="cursor-pointer border-b border-cosmos-border/50 transition-colors hover:bg-cosmos-surface"
              >
                <td className="px-3 py-2 font-mono text-xs text-cosmos-text">{planet.pl_name}</td>
                <td className="px-3 py-2 text-xs text-cosmos-muted">{planet.hostname}</td>
                <td className="px-3 py-2 text-xs text-cosmos-muted">{planet.discoverymethod}</td>
                <td className="px-3 py-2 text-xs text-cosmos-muted">{planet.disc_year ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-cosmos-muted">{fmt(planet.pl_rade, 2)}</td>
                <td className="px-3 py-2 text-xs text-cosmos-muted">{fmt(planet.pl_masse, 2)}</td>
                <td className="px-3 py-2 text-xs text-cosmos-muted">{fmt(planet.pl_orbper, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded border border-cosmos-border px-3 py-1 font-mono text-xs text-cosmos-muted transition-colors hover:text-cosmos-text disabled:opacity-30"
          >
            PREV
          </button>
          <span className="font-mono text-xs text-cosmos-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded border border-cosmos-border px-3 py-1 font-mono text-xs text-cosmos-muted transition-colors hover:text-cosmos-text disabled:opacity-30"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  )
}
