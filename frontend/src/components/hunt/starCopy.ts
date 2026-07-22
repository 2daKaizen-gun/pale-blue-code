// Shared, purely-descriptive copy helpers for a frontier star (Phase 10 sub-10-4).
// Every helper speaks only about the *star* — brightness, temperature, distance, when
// its light arrived — never about a planet, so nothing here can leak the hunt's answer
// (honesty nail #3). Used by both the fresh-sky feed and the first-look reveal.

// Days between an observation date (YYYY-MM-DD) and today. Null-safe.
export function daysAgo(observed: string | null): number | null {
  if (!observed) return null
  const then = Date.parse(observed)
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000))
}

// The Sun is ~5772 K. Compare — only when Teff is actually known, so we never invent.
export function warmth(teff: number | null): string | null {
  if (teff == null) return null
  if (teff >= 5200 && teff <= 6300) return '태양을 닮은 별'
  if (teff > 6300) return '태양보다 뜨거운 별'
  return '태양보다 차가운 별'
}

// TESS-band apparent brightness (smaller Tmag = brighter).
export function brightness(tmag: number | null): string | null {
  if (tmag == null) return null
  if (tmag < 9) return '맨눈에 가까운 밝기'
  if (tmag < 11) return '밝은 편'
  return '어두운 편'
}

// Parsecs → light-years (rounded), the more intuitive unit. Null-safe.
export function lightYears(distancePc: number | null): number | null {
  return distancePc == null ? null : Math.round(distancePc * 3.262)
}
