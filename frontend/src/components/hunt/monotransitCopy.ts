import type {
  FetchPlanSummary,
  HuntDisposition,
  MonotransitLedgerEntry,
  PoolClassification,
  SizeVerdict,
} from '../../lib/api/monotransit'

/**
 * Pure presentation for the single-transit hunt (sub-11-3 Light 4). The backend
 * returns a disposition per star and a numeric survivor; the UI renders sentences.
 * Kept pure and separate (like starCopy.ts) so the honest framing is unit-tested,
 * not buried in JSX: a survivor is a *light-curve single-transit candidate*, never a
 * "planet", and "searched, none survived" is a first-class outcome, not an error.
 */

// Ordered closest-to-a-candidate first — the order the summary strip reads in.
export const DISPOSITION_ORDER: HuntDisposition[] = [
  'candidate',
  'rejected',
  'held',
  'insignificant',
  'no_event',
  'not_fetched',
]

export const DISPOSITION_LABEL: Record<HuntDisposition, string> = {
  candidate: '단일 트랜짓 후보',
  rejected: '판별자에서 탈락',
  held: '판단 보류',
  insignificant: '유의성 미달',
  no_event: '딥 없음',
  not_fetched: '미수집',
}

// The four lone-event discriminators, in plain language for a rejection card.
export const DISCRIMINATOR_LABEL: Record<string, string> = {
  edge: '세그먼트 경계 (계기 인공물 자리)',
  coherence: '한 점에 몰린 딥 (스파이크)',
  flare: '옆의 밝아짐 (항성 플레어)',
  symmetry: '한쪽으로 치우친 램프 (비대칭)',
}

export interface DispositionCount {
  disposition: HuntDisposition
  label: string
  count: number
}

/**
 * Roll the per-star ledger up into ordered, non-empty counts for the summary strip.
 * Every star is accounted for; dispositions that never occurred are dropped so the
 * strip shows only what the hunt actually saw.
 */
export function summarizeLedger(ledger: MonotransitLedgerEntry[]): DispositionCount[] {
  const counts = new Map<HuntDisposition, number>()
  for (const entry of ledger) {
    counts.set(entry.disposition, (counts.get(entry.disposition) ?? 0) + 1)
  }
  return DISPOSITION_ORDER.filter((d) => counts.has(d)).map((d) => ({
    disposition: d,
    label: DISPOSITION_LABEL[d],
    count: counts.get(d) as number,
  }))
}

/**
 * The representative detection floor of a finished hunt: the median of the per-star
 * sensitivity floors, over the stars actually searched. `null` when nothing was searched
 * (no floor to state). This is a floor, NOT a completeness guarantee — a single transit
 * shallower than this could not have cleared the significance cut on these curves; it does
 * not promise every deeper transit was recovered (the search must also surface the dip).
 */
export function sensitivityFloor(ledger: MonotransitLedgerEntry[]): number | null {
  const floors = ledger
    .map((e) => e.depth_floor)
    .filter((d): d is number => d != null && Number.isFinite(d))
  if (!floors.length) return null
  const sorted = [...floors].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * The honest sentence for the sensitivity floor — stated as a floor, never as "we would
 * have found anything deeper." `null` floor yields `null` so the caller omits the line.
 */
export function sensitivityCaption(floor: number | null): string | null {
  if (floor == null) return null
  return `이 곡선들의 잡음이 허용하는 검출 바닥은 약 ${(floor * 100).toFixed(2)}% 깊이입니다 — 이보다 얕은 단일 트랜짓은 유의성 문턱조차 넘지 못합니다.`
}

// sub-11-6: the size verdict as a short chip label. plausible/too_big/unknown from the pool
// triage; a null class (star absent from the triage) reads the same as unknown.
export const SIZE_LABEL: Record<PoolClassification, string> = {
  plausible: '행성 크기',
  too_big: '검출돼도 별',
  unknown: '크기 미상',
}

/**
 * The honest size line for a survivor: whether a detection on this star could be a planet at all,
 * and how small. A plausible survivor names its minimum detectable planet radius (the real prize);
 * a too_big one is named star-sized — the dip is reported, but it cannot be a planet. A star with
 * no triage (null / unknown) reads "크기 미상", never a guess.
 */
export function survivorSizeNote(s: SizeVerdict): string {
  if (s.size_class === 'plausible') {
    return s.min_planet_rjup != null
      ? `행성 크기 · 검출 시 ≥ ${s.min_planet_rjup.toFixed(2)} R♃`
      : SIZE_LABEL.plausible
  }
  if (s.size_class === 'too_big') return '검출돼도 별 (너무 큼)'
  return SIZE_LABEL.unknown
}

// sub-11-7: the fetch plan — which plausible dwarfs are worth fetching. The hunt searches only
// cached curves, so the honest surface names the targets and states plainly which still need
// their light fetched (a local, network step), never implying it has looked where it has not.

/**
 * The headline for the fetch plan: how many plausible-size targets there are, how many are
 * already searchable, and how many still wait on a fetch. An empty pool says so honestly.
 */
export function fetchPlanHeadline(s: FetchPlanSummary): string {
  if (s.plausible === 0) return '이 풀에는 행성 크기 표적이 없습니다'
  return `행성 크기 표적 ${s.plausible}개 — ${s.cached}개는 이미 뒤질 수 있고, ${s.pending}개는 아직 빛을 기다립니다`
}

/**
 * The best target line: the smallest-planet dwarf and how small a world a detection there could
 * be. `null` when the pool has no plausible target (the caller omits the line).
 */
export function fetchPlanBestTarget(s: FetchPlanSummary): string | null {
  if (!s.best_target || s.best_min_planet_rjup == null) return null
  return `최우선 표적 ${s.best_target} — 검출 시 최소 ${s.best_min_planet_rjup.toFixed(2)} R♃ 크기의 행성`
}

/**
 * The honest note for the pending targets: they are not searched yet — their light must be
 * fetched by a local step first. `null` when nothing is pending, so the caller omits the line.
 */
export function fetchPlanPendingNote(s: FetchPlanSummary): string | null {
  if (s.pending <= 0) return null
  return `아직 빛을 안 받아온 ${s.pending}개는 로컬에서 fetch해야 사냥이 뒤질 수 있습니다 — 도구는 보지 않은 곳을 봤다고 하지 않습니다.`
}

// sub-11-8: the minimum orbital period a single transit implies. Beyond a TESS sector's ~27-day
// span a planet cannot repeat inside one sector, so a bound past this is squarely the long-period
// ground BLS is blind to — the reason a monotransit is worth more than a machine's repeated dip.
const _LONG_PERIOD_DAYS = 27

/** Days rendered for reading: one decimal under 10, whole days above (a bound, not a measurement). */
export function formatPeriodDays(days: number): string {
  return days < 10 ? days.toFixed(1) : String(Math.round(days))
}

/**
 * The honest period line for a survivor: the shortest orbit its one transit could belong to,
 * stated as a lower bound — "at least", never "the period is". A bound past a sector's span names
 * the long-period framing (the machine's blind spot). `null` when no bound is known (no radius),
 * so the caller omits the line rather than inventing a number.
 */
export function survivorPeriodNote(minPeriodDays: number | null): string | null {
  if (minPeriodDays == null || !Number.isFinite(minPeriodDays) || minPeriodDays <= 0) return null
  const p = formatPeriodDays(minPeriodDays)
  const base = `이 한 번의 통과만으로도 궤도 주기는 최소 ${p}일 — 더 길 수는 있어도 짧을 수는 없는 하한입니다 (중심통과·원궤도 가정).`
  if (minPeriodDays >= _LONG_PERIOD_DAYS) {
    return `${base} 한 섹터 안에서 반복될 수 없는 긴 주기 — 기계가 접을 것이 없어 놓치는 자리입니다.`
  }
  return base
}

/**
 * The honest headline for a finished hunt: a candidate count when something survived,
 * else the empty-handed truth — searched N, none survived — never framed as failure.
 */
export function huntHeadline(searched: number, survivorCount: number): string {
  if (survivorCount > 0) {
    return `단일 트랜짓 후보 ${survivorCount}개 — 별 ${searched}개를 뒤진 끝에`
  }
  if (searched === 0) {
    return '아직 뒤질 광곡선이 없습니다 — 먼저 별의 빛을 받아오세요'
  }
  return `별 ${searched}개를 뒤졌고, 살아남은 후보는 없습니다 — 그게 정직한 결과입니다`
}
