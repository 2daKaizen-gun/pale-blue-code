import type { BLSData } from '../../lib/api/bls'
import type { KOIMatch, VettingReport } from '../../lib/api/hunt'
import { buildDiscoveryRecord, downloadJSON } from '../../lib/discovery'
import { REPORT_LINKS } from '../../lib/reportLinks'

interface Props {
  kicId: number
  bls: BLSData
  matches: KOIMatch[]
  vetReport: VettingReport | null
}

// The trust level of the vetting evidence the record carries. Mirrors the
// VettingReport card's palette so the export summary reads as the same verdict.
const TRUST_BADGE: Record<VettingReport['trust'], { badge: string; label: string }> = {
  strong: { badge: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300', label: '신뢰 후보' },
  weak: { badge: 'border-amber-400/50 bg-amber-500/10 text-amber-300', label: '검토 필요' },
  unlikely: { badge: 'border-cosmos-subtle bg-cosmos-bg text-cosmos-muted', label: '행성 아닐 가능성' },
}

// Shown after every hunt regardless of the KOI verdict: a hunter may want to
// keep or report a confirmed match, an unconfirmed candidate, or a signal that
// is not in the catalog at all. The exported record carries the vetting
// evidence (discovery@2) when it is available.
export default function DiscoveryActions({ kicId, bls, matches, vetReport }: Props) {
  const exportRecord = () => {
    const record = buildDiscoveryRecord(kicId, bls, matches, vetReport)
    downloadJSON(`discovery_kic-${kicId}.json`, record)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
      <p className="font-mono text-xs tracking-widest text-cosmos-muted">발견 기록</p>
      <p className="text-sm text-cosmos-muted">
        이 탐색 결과를 JSON으로 저장하거나, 시민 과학 프로젝트에 보고하세요.
      </p>

      {/* What the exported record carries — the export is not a black box. */}
      {vetReport ? (
        <div className="flex flex-wrap items-center gap-2 rounded border border-cosmos-border bg-cosmos-bg p-3 text-sm text-cosmos-muted">
          <span className="text-cosmos-text">판별 근거가 함께 저장됩니다:</span>
          <span
            className={`inline-block rounded border px-2 py-0.5 font-mono text-xs tracking-widest ${TRUST_BADGE[vetReport.trust].badge}`}
          >
            {TRUST_BADGE[vetReport.trust].label}
          </span>
          <span className="font-mono text-xs text-cosmos-subtle">
            {vetReport.passed_count}/{vetReport.total} 관문 통과
          </span>
        </div>
      ) : (
        <div className="rounded border border-cosmos-border bg-cosmos-bg p-3 text-sm text-cosmos-muted">
          판별 근거 없음 — 검출과 KOI 대조만 저장됩니다.
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-3 font-mono text-xs">
        <button
          onClick={exportRecord}
          className="rounded border border-cosmos-nebula px-3 py-1.5 text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white"
        >
          ↓ 결과 JSON 내보내기
        </button>
        {REPORT_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-cosmos-border px-3 py-1.5 text-cosmos-nebula transition-colors hover:border-cosmos-nebula"
          >
            {link.label} →
          </a>
        ))}
      </div>
    </div>
  )
}
