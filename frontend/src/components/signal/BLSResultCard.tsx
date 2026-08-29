import type { BLSData } from '../../lib/api/bls'

interface Props {
  data: BLSData
}

interface Row {
  label: string
  value: string
  note?: string
}

export default function BLSResultCard({ data }: Props) {
  const { best } = data
  const durationHours = (best.duration * 24).toFixed(1)
  const depthPct = (best.depth * 100).toFixed(4)

  const rows: Row[] = [
    { label: '주기', value: `${best.period.toFixed(3)}일` },
    { label: '트랜짓 지속시간', value: `${durationHours}시간` },
    { label: '트랜짓 깊이', value: `${depthPct}%` },
    { label: 'BLS 세기', value: best.power.toFixed(5), note: '신호 세기' },
  ]

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
      <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
        가장 강한 후보 — {data.planet_name}
      </p>
      <p className="mb-4 text-xl font-semibold text-cosmos-text">
        {best.period.toFixed(2)}일 주기 궤도
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {rows.map(({ label, value, note }) => (
          <div key={label}>
            <dt className="font-mono text-xs text-cosmos-muted">{label}</dt>
            <dd className="mt-0.5 font-mono text-sm text-cosmos-text">{value}</dd>
            {note && <dd className="font-mono text-xs text-cosmos-muted">{note}</dd>}
          </div>
        ))}
      </dl>
    </div>
  )
}
