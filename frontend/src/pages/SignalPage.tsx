import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchPlanets, type Planet } from '../lib/api/exoplanet'
import { fetchBLS, type BLSData } from '../lib/api/bls'
import Spinner from '../components/ui/Spinner'
import PlanetSearchBar from '../components/data/PlanetSearchBar'
import PeriodogramChart from '../components/signal/PeriodogramChart'
import BLSResultCard from '../components/signal/BLSResultCard'

export default function SignalPage() {
  const [searchParams] = useSearchParams()
  const initialPlanet = searchParams.get('planet') ?? ''

  const [planets, setPlanets] = useState<Planet[]>([])
  const [planetName, setPlanetName] = useState(initialPlanet)

  const [blsData, setBlsData] = useState<BLSData | null>(null)
  // Start in loading state immediately when URL has ?planet= — avoids flash of empty state
  const [loading, setLoading] = useState(!!initialPlanet)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlanets().then(setPlanets).catch(() => {})
  }, [])

  // Manual search triggered by button/search bar (event handler — not an effect, no lint warning)
  const search = useCallback(async (name: string) => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    setBlsData(null)
    try {
      const data = await fetchBLS(name.trim())
      setBlsData(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount when ?planet= is present.
  // All setState calls are inside async callbacks, not synchronously in the effect body.
  useEffect(() => {
    if (!initialPlanet) return
    let cancelled = false
    fetchBLS(initialPlanet)
      .then((data) => {
        if (!cancelled) { setBlsData(data); setLoading(false) }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [initialPlanet])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">PHASE 07</p>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">Signal</h1>
        <p className="text-sm text-cosmos-muted">
          잡음 바다에서 반복 신호를 찾아내는 알고리즘 — 케플러 위성이 행성을 발견한 방법
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <PlanetSearchBar
          planets={planets}
          value={planetName}
          onSearch={(name) => {
            setPlanetName(name)
            search(name)
          }}
        />
        <button
          onClick={() => search(planetName)}
          disabled={loading || !planetName.trim()}
          className="rounded-lg border border-cosmos-nebula bg-cosmos-elevated px-4 py-2 font-mono text-sm text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          FIND PERIOD
        </button>
      </div>

      {!loading && !error && !blsData && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <p className="font-mono text-sm text-cosmos-muted">
            행성 이름을 입력하고 FIND PERIOD를 누르세요
          </p>
          <p className="font-mono text-xs text-cosmos-muted opacity-60">
            케플러 광도곡선 캐시가 없으면 먼저 Data 페이지에서 불러오세요
          </p>
        </div>
      )}

      {loading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Spinner />
          <p className="font-mono text-xs text-cosmos-muted">
            65,000개 밝기 측정값에서 반복 신호 탐색 중…
          </p>
          <p className="font-mono text-xs text-cosmos-muted opacity-60">
            최초 실행 시 최대 60초 소요됩니다
          </p>
        </div>
      )}

      {error && (
        <div className="flex min-h-[40vh] items-center justify-center font-mono text-sm text-red-400">
          ERROR: {error}
        </div>
      )}

      {!loading && !error && blsData && (
        <div className="flex flex-col gap-6">
          <PeriodogramChart data={blsData} />
          <BLSResultCard data={blsData} />
        </div>
      )}
    </div>
  )
}
