import type { PoolClassification, PoolSummary, PoolTarget } from '../../lib/api/monotransit'

/**
 * Pure presentation for the pool target list (sub-11-5 Light 4). A transit depth maps to a
 * companion radius, so the detection floor becomes a minimum detectable planet radius per
 * star. Most of the bright frontier pool is giants, where a detection would be a star, not a
 * planet — the copy names that honestly and never dresses a giant up as a target. Kept pure
 * and unit-tested, like monotransitCopy.ts.
 */

export const CLASSIFICATION_LABEL: Record<PoolClassification, string> = {
  plausible: '행성 가능',
  too_big: '검출돼도 별 (너무 큼)',
  unknown: '반지름 미상',
}

/**
 * The honest headline: how few of the pool could host a detectable planet. The point of the
 * whole sub-phase is that the fresh bright sky is mostly giants, so we lead with that number.
 */
export function poolHeadline(summary: PoolSummary): string {
  const { total, plausible, too_big, unknown } = summary
  const tail = unknown > 0 ? `, ${unknown}개는 반지름을 알 수 없습니다` : ''
  return `별 ${total}개 중 ${plausible}개만이 행성을 품을 수 있습니다 — 나머지 ${too_big}개는 검출돼도 별입니다${tail}`
}

/** The minimum detectable planet radius as a label, in Jupiter radii; a dash when unknown. */
export function minPlanetLabel(t: PoolTarget): string {
  if (t.min_planet_rjup == null) return '—'
  return `≥ ${t.min_planet_rjup.toFixed(2)} R♃` // R♃ (Jupiter)
}
