import type { MonotransitLedgerEntry } from '../../lib/api/monotransit'
import { STAR_VERDICT } from './monotransitCopy'

/**
 * Decision D, surfaced in the product (2026-09-08). Path A's four sensitivity levers are all
 * measured and null (vision §9-2): our eye is as sharp as the pipeline can make it, and the
 * honest goal is no longer "we discovered a planet" but "here are the quiet stars where our
 * search actually reaches Earth size, with the measured sensitivity and the search's honest
 * disposition — a completeness statement, and a follow-up-ready hand-off."
 *
 * `scripts/earth_size_dossier.py` assembles this from the caches for the terminal; this is its
 * in-product twin, built purely from the hunt ledger the API already returns (each entry carries
 * `min_planet_rearth`, `depth_floor`, and a `disposition`). Pure and unit-tested, like
 * monotransitCopy.ts, so the honest framing is pinned: a target here has Earth-size *sensitivity*,
 * never a claimed planet, and "0 candidates" is a real result — a completeness statement — not an
 * absence dressed as failure.
 */

// The upper edge of the "Earth-size" bin, matching the backend dossier and completeness_hunt.
export const EARTH_MAX_REARTH = 1.25

/**
 * The Earth-size-sensitive targets from a hunt ledger: stars whose curve could have revealed a
 * planet at or below `earthMax` Earth radii, sharpest (smallest reachable planet) first. A star
 * with no measured reach (unsearched, or no radius) is not an Earth-size claim and is dropped.
 */
export function selectEarthSizeTargets(
  ledger: MonotransitLedgerEntry[],
  earthMax = EARTH_MAX_REARTH,
): MonotransitLedgerEntry[] {
  return ledger
    .filter(
      (e) =>
        e.min_planet_rearth != null &&
        Number.isFinite(e.min_planet_rearth) &&
        e.min_planet_rearth <= earthMax,
    )
    .sort((a, b) => (a.min_planet_rearth as number) - (b.min_planet_rearth as number))
}

/** How many of the Earth-size-sensitive targets carry a surviving single-transit candidate. */
export function countCandidates(targets: MonotransitLedgerEntry[]): number {
  return targets.filter((e) => e.disposition === 'candidate').length
}

/**
 * The dossier headline: how far our eye reached, stated as sensitivity, never as discovery. With a
 * surviving candidate it names it; with none it says so plainly. An empty target set is honest too.
 */
export function dossierHeadline(nTargets: number, nCandidates: number): string {
  if (nTargets === 0) {
    return '아직 지구크기 감도에 닿은 표적이 없습니다 — 더 조용한 별을 뒤져야 합니다'
  }
  if (nCandidates > 0) {
    return `지구크기까지 볼 수 있는 별 ${nTargets}개 — 그중 살아남은 단일 트랜짓 후보 ${nCandidates}개`
  }
  return `지구크기까지 볼 수 있는 별 ${nTargets}개 — 살아남은 후보는 아직 없습니다`
}

/**
 * The completeness statement for a zero-candidate dossier: a null at Earth-size sensitivity is a
 * real result, not a discovery and not a failure. `null` when there is a candidate (the caller
 * shows the candidate instead) or no target at all.
 */
export function dossierCompletenessNote(nTargets: number, nCandidates: number): string | null {
  if (nTargets === 0 || nCandidates > 0) return null
  return '이건 "발견"이 아니라 정직한 완전성 진술입니다 — 이 조용한 별들을 지구크기 감도로 훑었고, 단일 트랜짓 이벤트가 없었습니다. 감도는 실측했고(아래 각 별의 검출 바닥), 없다는 것도 결과입니다.'
}

/** The follow-up path — where an eventual survivor would go. Stated once, honestly. */
export function dossierFollowUpNote(): string {
  return '언젠가 후보가 살아남으면, 광도곡선만으로는 확정할 수 없습니다 — 지상 관측(측광·분광)이 필요합니다. 그 다리는 ExoFOP-TESS / TFOP이고, 우리 산출물은 그대로 넘길 수 있는 형태입니다.'
}

/** The smallest planet a curve could reveal, as a reading phrase — a minimum ("이상"), never "is". */
export function reachLabel(minRearth: number): string {
  return `지구 반지름의 ${minRearth.toFixed(2)}배 이상`
}

/** The detection floor as a reading percentage, or null when there is none to state. */
export function floorLabel(depthFloor: number | null): string | null {
  if (depthFloor == null || !Number.isFinite(depthFloor) || depthFloor <= 0) return null
  return `${(depthFloor * 100).toFixed(2)}%`
}

/**
 * One honest line per Earth-size target: how small a world its curve could reveal, and what the
 * search actually found there (the one-word verdict). The reach is the prize; the verdict keeps it
 * honest — a "기각" or "잡음" target still counts toward *sensitivity*, but never toward a find.
 */
export function earthTargetLine(entry: MonotransitLedgerEntry): string {
  const reach = entry.min_planet_rearth != null ? reachLabel(entry.min_planet_rearth) : '크기 미상'
  const verdict = STAR_VERDICT[entry.disposition]
  const floor = floorLabel(entry.depth_floor)
  const floorClause = floor ? ` · 검출 바닥 ${floor}` : ''
  return `${reach}${floorClause} · ${verdict}`
}
