import type { BLSData } from '../../lib/api/bls'
import type { KOIMatch } from '../../lib/api/hunt'
import { buildDiscoveryRecord, downloadJSON } from '../../lib/discovery'

interface Props {
  kicId: number
  bls: BLSData
  matches: KOIMatch[]
}

// Shown after every hunt regardless of the KOI verdict: a hunter may want to
// keep or report a confirmed match, an unconfirmed candidate, or a signal that
// is not in the catalog at all.
export default function DiscoveryActions({ kicId, bls, matches }: Props) {
  const exportRecord = () => {
    const record = buildDiscoveryRecord(kicId, bls, matches)
    downloadJSON(`discovery_kic-${kicId}.json`, record)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
      <p className="font-mono text-xs tracking-widest text-cosmos-muted">발견 기록</p>
      <p className="text-sm text-cosmos-muted">
        이 탐색 결과를 JSON으로 저장하거나, 시민 과학 프로젝트에 보고하세요.
      </p>
      <div className="mt-1 flex flex-wrap gap-3 font-mono text-xs">
        <button
          onClick={exportRecord}
          className="rounded border border-cosmos-nebula px-3 py-1.5 text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white"
        >
          ↓ 결과 JSON 내보내기
        </button>
        <a
          href="https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-cosmos-border px-3 py-1.5 text-cosmos-nebula transition-colors hover:border-cosmos-nebula"
        >
          Planet Hunters →
        </a>
        <a
          href="https://exoplanetarchive.ipac.caltech.edu/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-cosmos-border px-3 py-1.5 text-cosmos-nebula transition-colors hover:border-cosmos-nebula"
        >
          NASA Exoplanet Archive →
        </a>
      </div>
    </div>
  )
}
