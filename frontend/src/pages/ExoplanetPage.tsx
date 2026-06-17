import { useState, useEffect, useMemo } from 'react'
import { fetchPlanets, type Planet } from '../lib/api/exoplanet'
import Spinner from '../components/ui/Spinner'
import FilterPanel from '../components/exoplanet/FilterPanel'
import PlanetTable from '../components/exoplanet/PlanetTable'
import ScatterPlot from '../components/exoplanet/ScatterPlot'
import PlanetDetail from '../components/exoplanet/PlanetDetail'
import TimelineView from '../components/exoplanet/TimelineView'

type View = 'scatter' | 'table' | 'timeline'

export default function ExoplanetPage() {
  const [planets, setPlanets] = useState<Planet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('scatter')
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set())
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)

  useEffect(() => {
    fetchPlanets()
      .then((data) => {
        setPlanets(data)
        setSelectedMethods(new Set(data.map((p) => p.discoverymethod)))
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const methods = useMemo(
    () => [...new Set(planets.map((p) => p.discoverymethod))].sort(),
    [planets]
  )

  const filtered = useMemo(
    () => planets.filter((p) => selectedMethods.has(p.discoverymethod)),
    [planets, selectedMethods]
  )

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )

  if (error)
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-mono text-sm text-red-400">
        ERROR: {error}
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">PHASE 05</p>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">Exoplanet</h1>
        <p className="text-sm text-cosmos-muted">
          {planets.length.toLocaleString()} confirmed exoplanets · NASA Exoplanet Archive
        </p>
      </header>

      <div className="flex items-center gap-4">
        <div className="flex overflow-hidden rounded-lg border border-cosmos-border">
          {(['scatter', 'table', 'timeline'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 font-mono text-sm tracking-wider transition-colors ${
                view === v
                  ? 'bg-cosmos-elevated text-cosmos-text'
                  : 'text-cosmos-muted hover:text-cosmos-text'
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-cosmos-muted">
          {filtered.length.toLocaleString()} planets shown
        </span>
      </div>

      <FilterPanel
        methods={methods}
        selected={selectedMethods}
        onChange={setSelectedMethods}
        planets={planets}
      />

      {view === 'timeline' ? (
        <TimelineView planets={planets} />
      ) : (
        <div className="relative">
          {view === 'scatter' ? (
            <ScatterPlot
              planets={filtered}
              selectedPlanet={selectedPlanet}
              onSelect={setSelectedPlanet}
            />
          ) : (
            <PlanetTable planets={filtered} onSelect={setSelectedPlanet} />
          )}

          {selectedPlanet && (
            <PlanetDetail
              planet={selectedPlanet}
              onClose={() => setSelectedPlanet(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
