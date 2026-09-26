import { useState, useEffect, useRef } from 'react'
import type { Planet } from '../../lib/api/exoplanet'

interface Props {
  planets: Planet[]
  value: string
  onSearch: (name: string) => void
}

export default function PlanetSearchBar({ planets, value, onSearch }: Props) {
  const [input, setInput] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Follow the controlled value when the parent changes it (adjusted during
  // render, React's pattern for resetting state on a prop change).
  const [syncedValue, setSyncedValue] = useState(value)
  if (syncedValue !== value) {
    setSyncedValue(value)
    setInput(value)
  }

  const suggestions = input.length >= 2
    ? planets
        .filter((p) => p.pl_name.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 8)
    : []

  function handleSelect(name: string) {
    setInput(name)
    setOpen(false)
    onSearch(name)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      setOpen(false)
      onSearch(input.trim())
    }
    if (e.key === 'Escape') setOpen(false)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="행성 이름 입력 (예: Kepler-452 b)"
          className="flex-1 rounded-lg border border-cosmos-border bg-cosmos-elevated px-3 py-2 font-mono text-sm text-cosmos-text placeholder:text-cosmos-muted focus:border-cosmos-nebula focus:outline-none"
        />
        <button
          onClick={() => { setOpen(false); onSearch(input.trim()) }}
          className="rounded-lg border border-cosmos-border bg-cosmos-elevated px-4 py-2 font-mono text-sm text-cosmos-muted transition-colors hover:text-cosmos-text"
        >
          검색
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-cosmos-border bg-cosmos-elevated shadow-lg">
          {suggestions.map((p) => (
            <li
              key={p.pl_name}
              onMouseDown={() => handleSelect(p.pl_name)}
              className="cursor-pointer px-3 py-2 font-mono text-sm text-cosmos-text hover:bg-cosmos-bg"
            >
              <span>{p.pl_name}</span>
              <span className="ml-2 text-xs text-cosmos-muted">{p.discoverymethod}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
