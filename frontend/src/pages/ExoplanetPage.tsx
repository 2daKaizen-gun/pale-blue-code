import { useState, useEffect } from 'react'
import { fetchPlanets, type Planet } from '../lib/api/exoplanet'
import Spinner from '../components/ui/Spinner'

export default function ExoplanetPage() {
  const [planets, setPlanets] = useState<Planet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlanets()
      .then(setPlanets)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

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
    </div>
  )
}
