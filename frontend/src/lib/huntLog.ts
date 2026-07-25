/**
 * Pale Blue Code — Phase 9-B: the frontier hunt log.
 *
 * The frontier is mostly empty hands (9B-PLAN §3-3), and honesty means showing
 * that plainly — "37번 사냥, 후보 0 — 개척은 원래 이렇다". This module keeps an
 * append-only log of hunt outcomes in localStorage so the tally survives a
 * reload, and aggregates it into the honest counts the panel shows.
 *
 * Design: the aggregation, append, and (de)serialize logic are PURE functions so
 * they unit-test under the `node` vitest environment; the localStorage read/write
 * is a thin wrapper on top (guarded for SSR/no-storage) that the pure core drives.
 * The log never leaves the browser.
 */

// What a single hunt resolved to. `strong`/`weak`/`unlikely` are the three vet
// verdicts of a hunt that actually ran; `recorded` (already on file) and `no_lc`
// (Kepler never observed it) are turned away BEFORE the vetter, so they are not
// hunts — the stats keep them apart from the honest "N번 사냥" count.
export type HuntOutcome = 'strong' | 'weak' | 'unlikely' | 'insignificant' | 'recorded' | 'no_lc'

export interface HuntLogEntry {
  kic_id: number
  outcome: HuntOutcome
  at: string // ISO timestamp
}

export interface HuntStats {
  hunts: number // vetter actually ran: strong + weak + unlikely + insignificant
  candidates: number // strong verdicts — the earned "후보" (nail #3)
  weak: number // ambiguous, needs another look
  emptyHands: number // unlikely (vetted as noise/binary) or insignificant (no real
  //   detection to vet) — the honest majority. Both are empty hands from the hunt.
  recorded: number // already-on-file stars turned away at the gate
  noLc: number // stars Kepler never observed
}

const STORAGE_KEY = 'pale-blue-code/hunt-log@1'
const MAX_ENTRIES = 500 // keep the log bounded; oldest hunts fall off the end

// Pure aggregation over the log. `hunts` counts only outcomes that ran the vetter
// — a recorded/no-lc star was never hunted, so it is not in that total (honest
// denominator for "N번 사냥, 후보 M").
export function computeStats(entries: HuntLogEntry[]): HuntStats {
  const stats: HuntStats = {
    hunts: 0,
    candidates: 0,
    weak: 0,
    emptyHands: 0,
    recorded: 0,
    noLc: 0,
  }
  for (const e of entries) {
    switch (e.outcome) {
      case 'strong':
        stats.candidates++
        stats.hunts++
        break
      case 'weak':
        stats.weak++
        stats.hunts++
        break
      case 'unlikely':
        stats.emptyHands++
        stats.hunts++
        break
      case 'insignificant':
        stats.emptyHands++    // no real detection — empty hands, but the vetter did run
        stats.hunts++
        break
      case 'recorded':
        stats.recorded++
        break
      case 'no_lc':
        stats.noLc++
        break
    }
  }
  return stats
}

// Append one outcome, keeping the log bounded to the most recent MAX_ENTRIES.
export function appendEntry(entries: HuntLogEntry[], entry: HuntLogEntry): HuntLogEntry[] {
  const next = [...entries, entry]
  return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
}

// Parse a stored log tolerantly: unknown/corrupt content yields an empty log
// rather than throwing — a bad localStorage value must never break the page.
export function parseLog(raw: string | null): HuntLogEntry[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(
      (e): e is HuntLogEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof e.kic_id === 'number' &&
        typeof e.at === 'string' &&
        isOutcome(e.outcome),
    )
  } catch {
    return []
  }
}

const OUTCOMES: readonly HuntOutcome[] = ['strong', 'weak', 'unlikely', 'insignificant', 'recorded', 'no_lc']
function isOutcome(v: unknown): v is HuntOutcome {
  return typeof v === 'string' && (OUTCOMES as readonly string[]).includes(v)
}

export function serializeLog(entries: HuntLogEntry[]): string {
  return JSON.stringify(entries)
}

// ── localStorage wrapper (thin; the pure core above does the real work) ──────

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // access can throw under strict privacy settings
  }
}

export function loadHuntLog(): HuntLogEntry[] {
  const s = storage()
  return s ? parseLog(s.getItem(STORAGE_KEY)) : []
}

// Record one outcome and persist, returning the updated log so a caller can
// recompute stats without a second read. A no-op (returns the read log) when
// storage is unavailable, so the hunt still works, just without a running tally.
export function recordHunt(kicId: number, outcome: HuntOutcome): HuntLogEntry[] {
  const s = storage()
  const entry: HuntLogEntry = { kic_id: kicId, outcome, at: new Date().toISOString() }
  const next = appendEntry(loadHuntLog(), entry)
  if (s) s.setItem(STORAGE_KEY, serializeLog(next))
  return next
}

export function clearHuntLog(): HuntLogEntry[] {
  storage()?.removeItem(STORAGE_KEY)
  return []
}
