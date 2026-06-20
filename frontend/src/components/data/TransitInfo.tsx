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
  return `~${rEarth.toFixed(2)} R⊕`
}

export default function TransitInfo({ fold, planet }: Props) {
  const depth = fold.transit_depth
  const depthPct = depth != null ? `${(depth * 100).toFixed(3)}%` : null
  const estRadius = depth != null ? estimateRadius(depth) : null
  const knownRadius =
    planet?.pl_rade != null ? `${planet.pl_rade.toFixed(3)} R⊕` : null

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-4">
      <p className="mb-3 font-mono text-xs tracking-widest text-cosmos-muted">TRANSIT SIGNAL</p>

      <Row label="Transit Depth" value={depthPct} />
      <Row
        label="Est. Radius (from depth)"
        value={estRadius ? `${estRadius} *` : null}
      />
      <Row label="Known Radius (catalog)" value={knownRadius} />
      <Row
        label="Orbital Period"
        value={`${fold.period.toFixed(3)} days`}
      />
      <Row label="Mission" value={null} />

      {estRadius && (
        <p className="mt-3 font-mono text-xs text-cosmos-muted">
          * assuming solar-type host (R* = 1 R☉)
        </p>
      )}
    </div>
  )
}
