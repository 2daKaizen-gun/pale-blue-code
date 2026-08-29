import type { PoolClassification } from '../../lib/api/monotransit'

/**
 * The one vocabulary (2026-08-07). The legibility north star (making-the-tool-legible.md §1a)
 * named terminology sprawl as a root cause: the same category of star — a frontier-pool star
 * small enough that a detected dip could be a planet — was called four different things across
 * three files ("행성 가능", "행성 크기", "행성 크기 표적", "사냥할 가치가 있는 별"), so one set of
 * stars looked like four unrelated things. This module is the single source of truth for those
 * words. Every hunt/pool surface reads its labels from here — change a word once, everywhere.
 *
 * The canonical noun is **행성 크기 표적** — honest by construction (§5 guardrail: it is a *size*
 * judgment from catalog geometry, R_planet = √depth × R_star, NOT a claim a planet is there).
 */

// The category name, full noun phrase — for a title, a legend, a sentence.
export const SIZE_CLASS_LABEL: Record<PoolClassification, string> = {
  plausible: '행성 크기 표적', // small enough that a detected dip could be a planet
  too_big: '검출돼도 별', // a detected dip would be a star, not a planet
  unknown: '크기 미상', // no stellar radius on file — cannot say
}

// The short form for a tight chip, where the full noun phrase will not fit.
export const SIZE_CLASS_CHIP: Record<PoolClassification, string> = {
  plausible: '행성 크기',
  too_big: '검출돼도 별',
  unknown: '크기 미상',
}

// One line saying what the category IS — for a subtitle or a filter legend.
export const SIZE_CLASS_GLOSS: Record<PoolClassification, string> = {
  plausible: '별이 작아서, 밝기 꺼짐이 검출되면 행성 크기일 수 있는 표적',
  too_big: '별이 커서, 밝기 꺼짐이 검출돼도 행성이 아니라 별인 표적',
  unknown: '별의 반지름을 몰라 크기를 판정할 수 없는 표적',
}
