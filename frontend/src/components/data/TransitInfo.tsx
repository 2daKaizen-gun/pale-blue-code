import type { PhaseFoldData } from '../../lib/api/lightcurve'
import type { Planet } from '../../lib/api/exoplanet'

interface Props {
  fold: PhaseFoldData
  planet: Planet | null
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cosmos-border/50 py-2">
      <span className="shrink-0 font-mono text-xs text-cosmos-muted">{label}</span>
      <span className="text-right font-mono text-xs text-cosmos-text">{value ?? '—'}</span>
    </div>
  )
}

// Estimate planet radius from transit depth assuming solar-type host star.
// δ = (Rp/R*)^2  →  Rp = R* × √δ  (R* ≈ 1 R☉ = 109.08 R⊕)
function estimateRadius(depth: number): string {
  const rEarth = Math.sqrt(depth) * 109.08
  return `지구의 ~${rEarth.toFixed(2)}배`
}

export default function TransitInfo({ fold, planet }: Props) {
  const depth = fold.transit_depth
  const depthPct = depth != null ? `${(depth * 100).toFixed(3)}%` : null
  const estRadius = depth != null ? estimateRadius(depth) : null
  const knownRadius =
    planet?.pl_rade != null ? `지구의 ${planet.pl_rade.toFixed(3)}배` : null

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-4">
      <p className="mb-3 font-mono text-xs tracking-widest text-cosmos-muted">트랜짓 신호</p>

      <Row label="트랜짓 깊이" value={depthPct} />
      <Row
        label="추정 반지름 (깊이로부터)"
        value={estRadius ? `${estRadius} *` : null}
      />
      <Row label="실측 반지름 (카탈로그)" value={knownRadius} />
      <Row
        label="공전 주기"
        value={`${fold.period.toFixed(3)}일`}
      />
      <Row label="관측 위성" value={null} />

      {estRadius && (
        <p className="mt-3 font-mono text-xs text-cosmos-muted">
          * 태양형 별 가정 (모항성 반지름 = 태양 1개)
        </p>
      )}
    </div>
  )
}
