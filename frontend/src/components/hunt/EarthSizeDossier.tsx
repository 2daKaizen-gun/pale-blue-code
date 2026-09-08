import type { MonotransitLedgerEntry } from '../../lib/api/monotransit'
import {
  countCandidates,
  dossierCompletenessNote,
  dossierFollowUpNote,
  dossierHeadline,
  earthTargetLine,
  selectEarthSizeTargets,
} from './earthSizeDossier'

/**
 * Decision D, in the product: the stars where our search actually reaches Earth size, with the
 * measured sensitivity and the honest disposition — a completeness statement, not a discovery
 * (vision §9-2). Pure presentation over the hunt ledger already in hand (no fetch); the honest
 * wording lives in earthSizeDossier.ts and is unit-tested there. Renders nothing when no target
 * reaches Earth size, so it never claims a reach the search has not measured.
 */
export default function EarthSizeDossier({ ledger }: { ledger: MonotransitLedgerEntry[] }) {
  const targets = selectEarthSizeTargets(ledger)
  if (targets.length === 0) return null

  const nCandidates = countCandidates(targets)
  const completeness = dossierCompletenessNote(targets.length, nCandidates)

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-cosmos-nebula/30 bg-cosmos-nebula/5 p-5">
      <div>
        <p className="mb-1 font-mono text-[11px] tracking-widest text-cosmos-nebula">
          여기까지 우리 눈이 닿았다 — 지구크기 감도
        </p>
        <h2 className="text-sm font-semibold text-cosmos-text">
          {dossierHeadline(targets.length, nCandidates)}
        </h2>
      </div>

      {completeness && <p className="text-xs text-cosmos-subtle">{completeness}</p>}

      <ul className="flex flex-col divide-y divide-cosmos-border/60">
        {targets.map((e) => (
          <li key={e.planet_name} className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="font-mono text-xs text-cosmos-text">{e.planet_name}</span>
            <span className="text-right text-xs text-cosmos-subtle">{earthTargetLine(e)}</span>
          </li>
        ))}
      </ul>

      <p className="border-t border-cosmos-border/60 pt-3 text-xs text-cosmos-subtle">
        {dossierFollowUpNote()}
      </p>
    </section>
  )
}
