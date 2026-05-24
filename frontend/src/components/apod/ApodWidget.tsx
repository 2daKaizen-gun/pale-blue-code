import { useEffect, useState } from 'react'
import type { Apod } from '../../lib/api/apod'
import { fetchApod } from '../../lib/api/apod'
import ApodCard from './ApodCard'

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

  if (loading) {
    // 로딩 중에도 카드와 같은 높이를 미리 잡아둔다 → 실제 카드로 교체될 때
    // 아래 로드맵이 밀리지 않음 (CLS 방지). 핵심은 aspect-video 미디어 박스.
    return (
      <div
        className="max-w-2xl animate-pulse"
        aria-busy="true"
        aria-label="APOD 불러오는 중"
      >
        <div className="mb-2 h-3 w-24 rounded bg-cosmos-surface" />
        <div className="mb-4 h-8 w-2/3 rounded bg-cosmos-surface" />
        <div className="mb-4 aspect-video w-full rounded-lg border border-cosmos-border bg-cosmos-surface" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-cosmos-surface" />
          <div className="h-3 w-full rounded bg-cosmos-surface" />
          <div className="h-3 w-4/5 rounded bg-cosmos-surface" />
        </div>
      </div>
    )
  }
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
