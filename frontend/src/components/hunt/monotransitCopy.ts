import type {
  FetchPlanSummary,
  HuntDisposition,
  MonotransitLedgerEntry,
  SizeVerdict,
} from '../../lib/api/monotransit'
import { SIZE_CLASS_CHIP } from './vocabulary'

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
  no_event: '밝기 꺼짐 없음',
  not_fetched: '미수집',
}

// The four lone-event discriminators, in plain language for a rejection card.
// Transliterations/instrument jargon unwound (2026-08-26): a person should read the *shape* that
// gave the event away without a glossary — "세그먼트/램프/플레어" are named by what they look like,
// the technical word kept in parentheses only where it still carries meaning.
export const DISCRIMINATOR_LABEL: Record<string, string> = {
  edge: '관측 구간 이음새 (망원경 잡티가 잘 끼는 자리)',
  coherence: '한 점에 몰린 밝기 꺼짐 (뾰족한 스파이크)',
  flare: '옆이 갑자기 밝아짐 (별의 폭발, 플레어)',
  symmetry: '한쪽으로 기울어진 모양 (비대칭)',
  baseline: '양옆 밝기가 어긋남 (기울기·계단 위에 얹힘)',
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

// --- readout redesign (2026-08-05): one star = one honest human sentence ---------------------
//
// After running our detector on real plausible dwarfs (docs/observations/instrument-log.md) the
// hunt page's failure showed plainly: it scattered a star's story across seven panels and spoke
// the machine's vocabulary (disposition / held / insignificant). This is the turn — every searched
// star said as ONE plain-language verdict, with the evidence one layer below. A quiet star is a
// first-class verdict here (the dominant real outcome), never an absence dressed as a failure.

/** The one-word verdict a person reads, per disposition — the machine's jargon translated. */
export const STAR_VERDICT: Record<HuntDisposition, string> = {
  candidate: '후보',
  rejected: '기각',
  held: '보류',
  insignificant: '잡음',
  no_event: '조용함',
  not_fetched: '미관측',
}

/** Depth floor as a reading percentage, or null when there is none to state. */
function floorPct(depthFloor: number | null): string | null {
  if (depthFloor == null || !Number.isFinite(depthFloor) || depthFloor <= 0) return null
  return `${(depthFloor * 100).toFixed(2)}%`
}

/**
 * One honest sentence for a single searched star — the heart of the readout. It translates the
 * disposition into plain language and folds in the evidence that matters for that verdict: how deep
 * a transit the curve could have shown (the sensitivity floor) for a quiet star, or which
 * discriminator caught a rejected event. Never jargon, never an absence dressed as a failure.
 */
export function starVerdictSentence(entry: MonotransitLedgerEntry): string {
  const floor = floorPct(entry.depth_floor)
  switch (entry.disposition) {
    case 'candidate':
      return '유의성과 네 판별을 모두 통과한 단일 트랜짓 후보 — 사람이 직접 볼 가치가 있습니다.'
    case 'rejected': {
      const reasons = entry.failed.map((f) => DISCRIMINATOR_LABEL[f] ?? f).join(', ')
      return `밝기가 잠깐 꺼졌지만 ${reasons || '판별에서 걸려'} — 행성이 아니라 계기·항성 신호로 판정했습니다.`
    }
    case 'held':
      return '밝기가 꺼졌지만 관측 구간이 짧아 유의성을 잴 수 없었습니다 — 정직하게 판단 보류.'
    case 'insignificant':
      return '밝기가 살짝 꺼졌지만 유의성 문턱을 넘지 못했습니다 — 잡음 수준.'
    case 'no_event':
      return floor
        ? `단일 트랜짓이 없습니다. 이 곡선은 ${floor}까지 볼 수 있었는데도 — 조용합니다.`
        : '단일 트랜짓이 없습니다 — 조용합니다.'
    case 'not_fetched':
      return '아직 빛을 받아오지 않았습니다 — 이 별은 보지 않았습니다.'
  }
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
// triage; a null class (star absent from the triage) reads the same as unknown. The words come
// from `vocabulary.ts` (the one source of truth) — re-exported so callers keep their import site.
export const SIZE_LABEL = SIZE_CLASS_CHIP

/**
 * A radius in Jupiter radii, written for a person instead of the bare "R♃" symbol
 * (2026-08-26 legibility pass). `atLeast` appends "이상" for the "≥" case — the honest
 * form for a minimum detectable size. The single source of truth for this phrasing, so
 * "목성 반지름의 N배" reads identically on every hunt/pool surface.
 */
export function jupiterRadiusLabel(rjup: number, atLeast = false): string {
  return `목성 반지름의 ${rjup.toFixed(2)}배${atLeast ? ' 이상' : ''}`
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
      ? `${SIZE_CLASS_CHIP.plausible} · 검출되면 ${jupiterRadiusLabel(s.min_planet_rjup, true)}`
      : SIZE_CLASS_CHIP.plausible
  }
  if (s.size_class === 'too_big') return '검출돼도 별 (너무 큼)'
  return SIZE_CLASS_CHIP.unknown
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
  return `최우선 표적 ${s.best_target} — 검출되면 ${jupiterRadiusLabel(s.best_min_planet_rjup, true)} 크기의 행성`
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

// sub-11-9: the warmest a survivor's world could run — an upper bound from its closest orbit
// (the minimum period) at zero albedo. Below this even the hottest case is temperate enough to
// ask about; the real temperature is only lower (a longer period, or any reflection, cools it).
const _TEMPERATE_MAX_K = 320

/** Rounded kelvin for reading — an upper bound, not a measurement. */
export function formatTempK(kelvin: number): string {
  return String(Math.round(kelvin))
}

/**
 * The honest temperature line for a survivor: the warmest it could run, stated as an upper
 * bound — "at most", never "is". The closest orbit (its minimum period) at zero albedo is the
 * hottest case, so the real temperature is only lower. When even that warmest case is temperate,
 * the line says the world is worth asking about. `null` when no bound is known (no Teff/radius/
 * period), so the caller omits the line rather than inventing a temperature.
 */
export function survivorTempNote(maxEqTempK: number | null): string | null {
  if (maxEqTempK == null || !Number.isFinite(maxEqTempK) || maxEqTempK <= 0) return null
  const t = formatTempK(maxEqTempK)
  const base = `가장 가까운 궤도에서도 평형온도는 많아야 약 ${t} K — 제로 알베도·최단 주기 가정의 상한이라, 더 멀거나 빛을 반사하면 더 차가워집니다.`
  if (maxEqTempK <= _TEMPERATE_MAX_K) {
    return `${base} 가장 뜨거운 경우조차 온화한 범위 — 물어볼 가치가 있는 세계입니다.`
  }
  return base
}

// sub-11-10: when this one transit could come round again. The earliest a second crossing could
// appear is t0 + the minimum period — before that date it cannot recur. The date is the earliest
// edge of the follow-up window (the bridge to real confirmation), never a predicted transit time:
// the true period is longer, so the real recurrence is later.

/**
 * The honest recurrence line for a survivor: the earliest a second transit could appear, stated
 * as the near edge of the follow-up window — "cannot recur before", never "the next transit is on".
 * The real period can only be longer, so the true recurrence is later. `null` when no date is known
 * (no period bound), so the caller omits the line rather than inventing a when.
 */
export function survivorRecurrenceNote(earliestRecurrence: string | null): string | null {
  if (!earliestRecurrence) return null
  return `두 번째 통과는 아무리 일러도 ${earliestRecurrence} 이후 — 관측 시각에 최소 주기를 더한 날로, 그 전에는 다시 스칠 수 없는 후속 관측 창의 앞 끝입니다 (t0는 TESS BTJD 기준). 진짜 주기는 더 길 수 있어 실제 재통과는 이보다 늦습니다.`
}

// sub-11-11: the follow-up brief. A survivor's numbers translated into an observer's frame — the
// epoch in BJD_TDB (the published/ExoFOP frame, not TESS-internal BTJD) and the depth in
// millimagnitudes (what a photometrist measures) — assembled as a copy-ready hand-off. A
// translation, never an upgrade: still a candidate, still one-sided bounds.

/** The epoch in BJD_TDB rendered for reading — full Julian Date, four decimals of a day. */
export function formatEpochBjdTdb(epoch: number): string {
  return epoch.toFixed(4)
}

/** Depth in millimagnitudes, one decimal — the observer's magnitude unit, not a fraction. */
export function formatMmag(mmag: number): string {
  return mmag.toFixed(1)
}

/**
 * The follow-up brief for a survivor: the same numbers in an observer's frame, ready to hand to a
 * confirmation campaign — the epoch in BJD_TDB, the depth in millimagnitudes, the duration in
 * hours, and (when known) the earliest a second transit could appear. It carries the caveats with
 * the numbers: still a light-curve single-transit candidate (not a planet), the bounds one-sided.
 * `null` when the core observer numbers (epoch and depth) are missing, so the caller omits it.
 */
export function survivorFollowUpBrief(
  epochBjdTdb: number | null,
  depthMmag: number | null,
  durationDays: number,
  earliestRecurrence: string | null,
): string | null {
  if (epochBjdTdb == null || depthMmag == null) return null
  const hours = (durationDays * 24).toFixed(1)
  const recur = earliestRecurrence ? ` 두 번째 통과는 아무리 일러도 ${earliestRecurrence} 이후.` : ''
  return `후속확인용 브리핑 — 에포크 BJD_TDB ${formatEpochBjdTdb(epochBjdTdb)}, 깊이 ${formatMmag(depthMmag)} mmag(밀리등급), 지속 ${hours}시간.${recur} 관측자 프레임으로 옮긴 같은 숫자일 뿐 — 여전히 광도곡선 단일 트랜짓 후보(행성 아님)이고 주기·온도는 한쪽 경계입니다. 이대로 Planet Hunters·ExoFOP 후속확인에 넘길 수 있습니다.`
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
