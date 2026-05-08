import { useEffect, useState } from 'react'
import type { Apod } from '../../lib/api/apod'
import { fetchApod } from '../../lib/api/apod'
import ApodCard from './ApodCard'
import Spinner from '../ui/Spinner'

export default function ApodWidget() {
  const [apod, setApod] = useState<Apod | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApod()
      .then((data) => setApod(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) {
    return (
      <div className="text-cosmos-muted text-sm font-mono">
        ⚠ APOD 데이터를 불러오지 못했어: {error}
      </div>
    )
  }
  if (!apod) return null

  return <ApodCard apod={apod} />
}
