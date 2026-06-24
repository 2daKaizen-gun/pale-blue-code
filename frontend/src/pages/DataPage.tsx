import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { fetchPlanets, type Planet } from '../lib/api/exoplanet'
import { fetchLightCurve, fetchFolded, type LightCurveData, type PhaseFoldData } from '../lib/api/lightcurve'
import Spinner from '../components/ui/Spinner'
import PlanetSearchBar from '../components/data/PlanetSearchBar'
import LightCurveChart from '../components/data/LightCurveChart'
import PhaseFoldChart from '../components/data/PhaseFoldChart'
import TransitInfo from '../components/data/TransitInfo'

const DEFAULT_PLANET = 'Kepler-452 b'

type View = 'raw' | 'folded'

export default function DataPage() {
  const [searchParams] = useSearchParams()
  const initialPlanet = searchParams.get('planet') ?? DEFAULT_PLANET

  const [planets, setPlanets] = useState<Planet[]>([])
  const [planetName, setPlanetName] = useState(initialPlanet)
  const [currentPlanet, setCurrentPlanet] = useState<Planet | null>(null)

  const [lcData, setLcData] = useState<LightCurveData | null>(null)
  const [foldData, setFoldData] = useState<PhaseFoldData | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [view, setView] = useState<View>('raw')

  // load planet catalog for autocomplete (non-blocking)
  useEffect(() => {
    fetchPlanets().then(setPlanets).catch(() => {/* autocomplete optional */})
  }, [])

  // resolve planet metadata from catalog
  useEffect(() => {
    if (planets.length === 0) return
    const match = planets.find((p) => p.pl_name.toLowerCase() === planetName.toLowerCase())
    setCurrentPlanet(match ?? null)
  }, [planets, planetName])

  const search = useCallback(async (name: string) => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    setLcData(null)
    setFoldData(null)
    setView('raw')
    setLoadingMsg('케플러 데이터 내려받는 중…')

    try {
      const lc = await fetchLightCurve(name.trim())
      setLcData(lc)
      setLoadingMsg('위상 접기 계산 중…')

      if (lc.period != null) {
        const folded = await fetchFolded(name.trim())
        setFoldData(folded)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }, [])

  // auto-search on mount (uses initialPlanet from URL or default)
  useEffect(() => {
    search(initialPlanet)
  }, [search, initialPlanet])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">PHASE 06</p>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">Data</h1>
        <p className="text-sm text-cosmos-muted">
          실제 케플러 위성이 측정한 별빛의 파형 — 보이지 않는 행성의 지문
        </p>
      </header>

      <PlanetSearchBar
        planets={planets}
        value={planetName}
        onSearch={(name) => {
          setPlanetName(name)
          search(name)
        }}
      />

      {loading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Spinner />
          {loadingMsg && (
            <p className="font-mono text-xs text-cosmos-muted">{loadingMsg}</p>
          )}
        </div>
      )}

      {error && (
        <div className="flex min-h-[40vh] items-center justify-center font-mono text-sm text-red-400">
          ERROR: {error}
        </div>
      )}

      {!loading && !error && lcData && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex overflow-hidden rounded-lg border border-cosmos-border">
              {(['raw', 'folded'] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  disabled={v === 'folded' && foldData == null}
                  className={`px-4 py-2 font-mono text-sm tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    view === v
                      ? 'bg-cosmos-elevated text-cosmos-text'
                      : 'text-cosmos-muted hover:text-cosmos-text'
                  }`}
                >
                  {v === 'raw' ? 'LIGHT CURVE' : 'PHASE FOLD'}
                </button>
              ))}
            </div>
            <Link
              to={`/signal?planet=${encodeURIComponent(planetName)}`}
              className="font-mono text-xs text-cosmos-nebula transition-colors hover:text-cosmos-text"
            >
              SIGNAL →
            </Link>
            <span className="font-mono text-xs text-cosmos-muted">
              {lcData.hostname} · {lcData.mission}
              {lcData.period != null && ` · period ${lcData.period.toFixed(2)} days`}
            </span>
          </div>

          {view === 'raw' && <LightCurveChart data={lcData} />}
          {view === 'folded' && foldData && <PhaseFoldChart data={foldData} />}

          {view === 'folded' && foldData == null && (
            <p className="font-mono text-xs text-cosmos-muted">
              위상 접기 데이터 없음 (공전 주기 미확인)
            </p>
          )}

          {foldData && (
            <TransitInfo fold={foldData} planet={currentPlanet} />
          )}
        </div>
      )}
    </div>
  )
}
