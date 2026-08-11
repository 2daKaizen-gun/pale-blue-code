import type { PoolSummary, PoolTarget } from '../../lib/api/monotransit'
import { SIZE_CLASS_LABEL } from './vocabulary'

/**
 * Pure presentation for the pool target list (sub-11-5 Light 4). A transit depth maps to a
 * companion radius, so the detection floor becomes a minimum detectable planet radius per
 * star. Most of the bright frontier pool is giants, where a detection would be a star, not a
 * planet — the copy names that honestly and never dresses a giant up as a target. Kept pure
 * and unit-tested, like monotransitCopy.ts.
 *
 * The category words come from `vocabulary.ts` (the one source of truth) — this file no longer
 * spells its own, so "행성 크기 표적" reads identically here and on the hunt front door.
 */

// Re-exported from the vocabulary so existing callers keep their import site; the words live once.
export const CLASSIFICATION_LABEL = SIZE_CLASS_LABEL

/**
 * The honest headline: how few of the pool could host a detectable planet. The point of the
 * whole sub-phase is that the fresh bright sky is mostly giants, so we lead with that number.
 */
export function poolHeadline(summary: PoolSummary): string {
  const { total, plausible, too_big, unknown } = summary
  const tail = unknown > 0 ? `, ${unknown}개는 반지름을 알 수 없습니다` : ''
  // The pool is now selected for the hunt (smallest stars first), so it can be all planet-size —
  // the honest headline then leads with that, not with a "only M of N" that implies giants dominate.
  if (too_big === 0 && plausible > 0) {
    return `별 ${total}개 전부가 행성 크기 표적입니다 — 작은 별만 골라 담았기 때문입니다${tail}`
  }
  return `별 ${total}개 중 ${plausible}개만이 행성을 품을 수 있습니다 — 나머지 ${too_big}개는 검출돼도 별입니다${tail}`
}

/** The minimum detectable planet radius as a label, in Jupiter radii; a dash when unknown. */
export function minPlanetLabel(t: PoolTarget): string {
  if (t.min_planet_rjup == null) return '—'
  return `≥ ${t.min_planet_rjup.toFixed(2)} R♃` // R♃ (Jupiter)
}
