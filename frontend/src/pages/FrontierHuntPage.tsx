import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchHuntLC,
  fetchHuntBLS,
  fetchVetting,
  checkRecorded,
  frontierRandom,
  type Mission,
  type VettingReport,
  type RecordedCheck,
  type FrontierStar,
} from '../lib/api/hunt'
import type { BLSData } from '../lib/api/bls'
import {
  loadHuntLog,
  recordHunt,
  clearHuntLog,
  computeStats,
  type HuntStats,
} from '../lib/huntLog'
import Spinner from '../components/ui/Spinner'
import FrontierFeed from '../components/hunt/FrontierFeed'
import FirstLook from '../components/hunt/FirstLook'
import FrontierTargetPicker from '../components/hunt/FrontierTargetPicker'
import FrontierVerdict from '../components/hunt/FrontierVerdict'
import HuntLog from '../components/hunt/HuntLog'
import DiscoveryActions from '../components/hunt/DiscoveryActions'
import Reveal from '../components/ui/Reveal'
import PeriodogramChart from '../components/signal/PeriodogramChart'
import BLSResultCard from '../components/signal/BLSResultCard'

/**
 * The frontier — a real solo hunt of stars with NO catalog entry (honesty nail
 * #3), separate from the educational demo hunt (HuntPage). Phase 10 makes it
 * mission-aware: the same flow hunts Kepler (KIC / KOI) or TESS (TIC / TOI),
 * chosen at the hub and carried in the `:mission` route param.
 *
 * Flow: pick a star → recorded gate (checkRecorded):
 *   - already on file  → "이미 기록된 천체" card, hunt not entered
 *   - unrecorded       → lc → bls → vet (9-A engine, reused unchanged)
 * No catalog cross-check here — by construction the star has no entry.
 */
interface MissionCopy {
  phaseLabel: string
  survey: string // human survey name
  idLabel: string // KIC | TIC
  catalog: string // KOI | TOI
  intro: string
  lcLoading: string
  noLcHint: string // shown when the survey never observed this star
}

const MISSION: Record<Mission, MissionCopy> = {
  kepler: {
    phaseLabel: 'FRONTIER · KEPLER',
    survey: '케플러',
    idLabel: 'KIC',
    catalog: 'KOI',
    intro:
      '아무도 기록하지 않은 별을 실제로 사냥한다 — KOI 카탈로그에 없는 별을 골라, 우리 판별기로 직접 거른다. 케플러는 하늘의 0.25%를 4년간 깊게 응시했다. 대부분은 빈손이고, 그 빈손도 정직한 결과다.',
    lcLoading: '케플러 광도곡선 수신 중…',
    noLcHint: '이 별은 케플러가 관측하지 않았어요 — 광도곡선이 없습니다. 다른 KIC로 시도해보세요.',
  },
  tess: {
    phaseLabel: 'FRONTIER · TESS',
    survey: 'TESS',
    idLabel: 'TIC',
    catalog: 'TOI',
    intro:
      '아무도 기록하지 않은 별을 실제로 사냥한다 — TOI 카탈로그에 없는 별을 골라, 우리 판별기로 직접 거른다. TESS는 하늘의 ~85%를 훑지만 한 구역을 겨우 ~27일만 본다. 얕게 보는 만큼 판별도 겸손해야 한다 — 그 정직함이 아래에 배지로 드러난다.',
    lcLoading: 'TESS 광도곡선 수신 중…',
    noLcHint: '이 별은 TESS가 관측하지 않았어요 — SPOC 광도곡선이 없습니다. 다른 TIC로 시도해보세요.',
  },
}

export default function FrontierHuntPage() {
  const { mission: missionParam } = useParams<{ mission?: string }>()
  const mission: Mission = missionParam === 'tess' ? 'tess' : 'kepler'
  const m = MISSION[mission]

  const [selectedKic, setSelectedKic] = useState<number | null>(null)
  // The enriched identity of the picked star (feed / TESS random), so we can play a
  // first-look reveal. Free-input picks have no enrichment → null.
  const [pickedStar, setPickedStar] = useState<FrontierStar | null>(null)

  const [checkLoading, setCheckLoading] = useState(false)
  const [recorded, setRecorded] = useState<RecordedCheck | null>(null)

  const [lcLoading, setLcLoading] = useState(false)
  const [blsLoading, setBlsLoading] = useState(false)
  const [vetLoading, setVetLoading] = useState(false)

  const [blsData, setBlsData] = useState<BLSData | null>(null)
  const [vetReport, setVetReport] = useState<VettingReport | null>(null)
  const [vetError, setVetError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The honest running tally (localStorage). Seeded from prior sessions so the
  // frontier's "N번 사냥, 후보 M" persists across reloads.
  const [stats, setStats] = useState<HuntStats>(() => computeStats(loadHuntLog()))

  const busy = checkLoading || lcLoading || blsLoading

  const runHunt = useCallback(async (kicId: number) => {
    const fail = (e: unknown) =>
      setError(e instanceof Error ? e.message : 'Unknown error')

    // Prime the LC cache so BLS won't 424. LC itself isn't displayed.
    setLcLoading(true)
    try {
      await fetchHuntLC(kicId, mission)
    } catch (e) {
      // A free-input star the survey never observed lands here.
      const msg = e instanceof Error ? e.message : ''
      const noLc = msg.includes('light curve') // "No Kepler/TESS ... light curve found"
      if (noLc) {
        // No light curve = never hunted; logged apart from the hunt count.
        setStats(computeStats(recordHunt(kicId, 'no_lc')))
      }
      setError(noLc ? m.noLcHint : msg || 'Unknown error')
      return
    } finally {
      setLcLoading(false)
    }

    setBlsLoading(true)
    let bls: BLSData
    try {
      bls = await fetchHuntBLS(kicId, mission)
      setBlsData(bls)
    } catch (e) {
      fail(e)
      return
    } finally {
      setBlsLoading(false)
    }

    // The four-gate vetting — the whole point of the frontier. Isolated to
    // vetError so a vet miss never blanks the BLS result.
    setVetLoading(true)
    await fetchVetting(kicId, mission)
      .then((report) => {
        setVetReport(report)
        // The hunt ran to a verdict — tally it by trust (the honest outcome).
        setStats(computeStats(recordHunt(kicId, report.trust)))
      })
      .catch((e) => setVetError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setVetLoading(false))
  }, [mission, m])

  const onPick = useCallback(
    async (kicId: number, star: FrontierStar | null = null) => {
      setSelectedKic(kicId)
      setPickedStar(star)
      setError(null)
      setRecorded(null)
      setBlsData(null)
      setVetReport(null)
      setVetError(null)

      // Recorded gate: is this star already on file? (period-independent)
      setCheckLoading(true)
      let rec: RecordedCheck
      try {
        rec = await checkRecorded(kicId, mission)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return
      } finally {
        setCheckLoading(false)
      }

      if (rec.recorded) {
        setRecorded(rec) // already on file — not hunting ground, stop here
        setStats(computeStats(recordHunt(kicId, 'recorded')))
        return
      }
      await runHunt(kicId)
    },
    [runHunt, mission],
  )

  const clearLog = () => setStats(computeStats(clearHuntLog()))

  const reset = () => {
    setSelectedKic(null)
    setPickedStar(null)
    setRecorded(null)
    setBlsData(null)
    setVetReport(null)
    setVetError(null)
    setError(null)
  }

  // Keep the pioneer loop going: draw another unrecorded star right away. Most
  // will be empty hands — that repetition is the honest texture of the frontier.
  const huntAgain = useCallback(async () => {
    try {
      const pick = await frontierRandom(mission)
      await onPick(pick.kic_id, pick.star)
    } catch (e) {
      setError(e instanceof Error ? e.message : '무작위 별을 뽑지 못했습니다')
    }
  }, [onPick, mission])

  // A terminal state has been reached — offer to hunt again.
  const done =
    selectedKic !== null &&
    !busy &&
    (recorded !== null || vetReport !== null || vetError !== null || error !== null)

  const loadingMessage = checkLoading
    ? `${m.catalog} 카탈로그와 대조 중 — 이미 기록된 별인지 확인…`
    : lcLoading
      ? m.lcLoading
      : '밝기 측정값에서 반복 신호 탐색 중…'

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="mb-1 flex items-center gap-3">
          <Link to="/hunt/frontier" className="font-mono text-xs text-cosmos-nebula hover:text-cosmos-text">
            ← 하늘 고르기
          </Link>
          <p className="font-mono text-xs tracking-widest text-cosmos-muted">{m.phaseLabel}</p>
        </div>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">Frontier · {m.survey}</h1>
        <p className="text-sm text-cosmos-muted">{m.intro}</p>
      </header>

      <HuntLog stats={stats} onClear={clearLog} />

      {selectedKic === null ? (
        <div className="flex flex-col gap-6">
          {/* The fresh-sky feed (TESS) — browse real stars instead of typing a
              number. Renders nothing for Kepler. The picker (random + free input)
              stays below as the expert path. */}
          <FrontierFeed mission={mission} onPick={onPick} busy={busy} />
          <FrontierTargetPicker onPick={onPick} busy={busy} mission={mission} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <button
            onClick={reset}
            disabled={busy}
            className="self-start font-mono text-xs text-cosmos-nebula transition-colors hover:text-cosmos-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← 타깃 선택으로
          </button>

          {/* First look — this star's identity, framed in time ("N일 전 도착, 아무도
              안 봤다"), before any verdict. key remounts it per pick so the reveal
              replays. Only for enriched picks (feed / TESS random); free input → none. */}
          {pickedStar && <FirstLook key={pickedStar.tic} star={pickedStar} />}

          {busy && (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
              <Spinner />
              <p className="font-mono text-xs text-cosmos-muted">{loadingMessage}</p>
              <p className="font-mono text-xs text-cosmos-muted opacity-60">
                최초 실행 시 최대 90초 소요됩니다
              </p>
            </div>
          )}

          {error && (
            <div className="flex min-h-[20vh] items-center justify-center px-4 text-center font-mono text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Recorded gate — already on file, not hunting ground */}
          {!busy && recorded && (
            <Reveal>
              <div className="flex flex-col gap-3 rounded-lg border border-cosmos-border bg-cosmos-surface p-5">
                <p className="font-mono text-xs tracking-widest text-cosmos-muted">
                  이미 기록된 천체
                </p>
                <p className="text-sm text-cosmos-muted">
                  <span className="font-mono text-cosmos-text">{m.idLabel} {recorded.kic_id}</span>
                  은(는) 이미 {m.catalog} 카탈로그에 기록되어 있습니다 — 단독 탐색 대상이 아닙니다.
                  이 별의 항목:
                </p>
                <ul className="flex flex-col gap-1 font-mono text-xs text-cosmos-muted">
                  {recorded.entries.map((e) => (
                    <li key={e.kepoi_name}>
                      <span className="text-cosmos-text">{e.kepoi_name}</span> — {e.disposition}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {/* Unrecorded → the hunt */}
          {!busy && !error && !recorded && blsData && (
            <>
              <Reveal>
                <PeriodogramChart data={blsData} />
              </Reveal>
              <Reveal delay={80}>
                <BLSResultCard data={blsData} />
              </Reveal>

              {vetLoading && (
                <div className="flex items-center gap-3 rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
                  <Spinner />
                  <p className="font-mono text-xs text-cosmos-muted">
                    네 관문으로 신호를 심문하는 중…
                  </p>
                </div>
              )}
              {vetError && (
                <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-5 font-mono text-xs text-cosmos-muted">
                  판별을 실행하지 못했습니다: {vetError}
                </div>
              )}
              {vetReport && (
                <Reveal>
                  <FrontierVerdict report={vetReport} />
                </Reveal>
              )}

              {/* Discovery record only for the earned find: strong + unrecorded
                  (9B-PLAN §6). matches=[] — no catalog entry exists by
                  construction, so the exported record honestly reads
                  in_catalog: false and carries the four-gate vetting evidence
                  (discovery@2). Weak/empty hands are tallied in the log, not
                  exported as a "발견". */}
              {vetReport?.trust === 'strong' && selectedKic !== null && (
                <Reveal delay={80}>
                  <DiscoveryActions
                    kicId={selectedKic}
                    bls={blsData}
                    matches={[]}
                    vetReport={vetReport}
                  />
                </Reveal>
              )}
            </>
          )}

          {done && (
            <div className="flex flex-col gap-3 border-t border-cosmos-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-cosmos-muted">
                개척은 반복입니다 — 대부분 빈손이고, 그 빈손도 결과입니다. 계속 사냥해보세요.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={huntAgain}
                  className="w-full rounded-lg border border-cosmos-nebula bg-cosmos-elevated px-4 py-2 font-mono text-sm text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white sm:w-auto"
                >
                  🎲 다른 미기록 별 사냥
                </button>
                <button
                  onClick={reset}
                  className="w-full rounded-lg border border-cosmos-border px-4 py-2 font-mono text-sm text-cosmos-muted transition-colors hover:text-cosmos-text sm:w-auto"
                >
                  타깃 선택으로
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-cosmos-subtle">
        판별기를 배우려면 알려진 사례로 시작하세요 —{' '}
        <Link to="/hunt" className="text-cosmos-nebula hover:text-cosmos-text">
          Hunt(시연용 데모)
        </Link>
      </p>
    </div>
  )
}
