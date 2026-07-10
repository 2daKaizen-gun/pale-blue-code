import { useState, useCallback } from 'react'
import {
  fetchHuntLC,
  fetchHuntBLS,
  fetchVetting,
  checkRecorded,
  type VettingReport,
  type RecordedCheck,
} from '../lib/api/hunt'
import type { BLSData } from '../lib/api/bls'
import { Link } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import FrontierTargetPicker from '../components/hunt/FrontierTargetPicker'
import FrontierVerdict from '../components/hunt/FrontierVerdict'
import Reveal from '../components/ui/Reveal'
import PeriodogramChart from '../components/signal/PeriodogramChart'
import BLSResultCard from '../components/signal/BLSResultCard'

/**
 * Phase 9-B — the frontier. A real solo hunt of stars with NO KOI entry
 * (honesty nail #3), separate from the educational demo hunt (HuntPage).
 *
 * Flow: pick a KIC → recorded gate (checkRecorded):
 *   - already on file  → "이미 기록된 천체" card, hunt not entered
 *   - unrecorded       → lc → bls → vet (9-A engine, reused unchanged)
 * No KOI cross-check here — by construction the star has no KOI entry.
 */
export default function FrontierHuntPage() {
  const [selectedKic, setSelectedKic] = useState<number | null>(null)

  const [checkLoading, setCheckLoading] = useState(false)
  const [recorded, setRecorded] = useState<RecordedCheck | null>(null)

  const [lcLoading, setLcLoading] = useState(false)
  const [blsLoading, setBlsLoading] = useState(false)
  const [vetLoading, setVetLoading] = useState(false)

  const [blsData, setBlsData] = useState<BLSData | null>(null)
  const [vetReport, setVetReport] = useState<VettingReport | null>(null)
  const [vetError, setVetError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = checkLoading || lcLoading || blsLoading

  const runHunt = useCallback(async (kicId: number) => {
    const fail = (e: unknown) =>
      setError(e instanceof Error ? e.message : 'Unknown error')

    // Prime the LC cache so BLS won't 424. LC itself isn't displayed.
    setLcLoading(true)
    try {
      await fetchHuntLC(kicId)
    } catch (e) {
      // A free-input star Kepler never observed lands here.
      const msg = e instanceof Error ? e.message : ''
      setError(
        msg.includes('No Kepler light curve')
          ? '이 별은 케플러가 관측하지 않았어요 — 광도곡선이 없습니다. 다른 KIC로 시도해보세요.'
          : msg || 'Unknown error',
      )
      return
    } finally {
      setLcLoading(false)
    }

    setBlsLoading(true)
    let bls: BLSData
    try {
      bls = await fetchHuntBLS(kicId)
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
    await fetchVetting(kicId)
      .then(setVetReport)
      .catch((e) => setVetError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setVetLoading(false))
  }, [])

  const onPick = useCallback(
    async (kicId: number) => {
      setSelectedKic(kicId)
      setError(null)
      setRecorded(null)
      setBlsData(null)
      setVetReport(null)
      setVetError(null)

      // Recorded gate: is this star already on file? (period-independent)
      setCheckLoading(true)
      let rec: RecordedCheck
      try {
        rec = await checkRecorded(kicId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return
      } finally {
        setCheckLoading(false)
      }

      if (rec.recorded) {
        setRecorded(rec) // already on file — not hunting ground, stop here
        return
      }
      await runHunt(kicId)
    },
    [runHunt],
  )

  const reset = () => {
    setSelectedKic(null)
    setRecorded(null)
    setBlsData(null)
    setVetReport(null)
    setVetError(null)
    setError(null)
  }

  const loadingMessage = checkLoading
    ? 'KOI 카탈로그와 대조 중 — 이미 기록된 별인지 확인…'
    : lcLoading
      ? '케플러 광도곡선 수신 중…'
      : '65,000개 밝기 측정값에서 반복 신호 탐색 중…'

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">PHASE 09-B</p>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">Frontier</h1>
        <p className="text-sm text-cosmos-muted">
          아무도 기록하지 않은 별을 실제로 사냥한다 — KOI 카탈로그에 <span className="text-cosmos-text">없는</span> 별을
          골라, 우리 판별기로 직접 거른다. 대부분은 빈손이고, 그 빈손도 정직한 결과다.
        </p>
      </header>

      {selectedKic === null ? (
        <FrontierTargetPicker onPick={onPick} busy={busy} />
      ) : (
        <div className="flex flex-col gap-6">
          <button
            onClick={reset}
            disabled={busy}
            className="self-start font-mono text-xs text-cosmos-nebula transition-colors hover:text-cosmos-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← 타깃 선택으로
          </button>

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
                  <span className="font-mono text-cosmos-text">KIC {recorded.kic_id}</span>
                  은(는) 이미 KOI 카탈로그에 기록되어 있습니다 — 단독 탐색 대상이 아닙니다.
                  이 별의 항목:
                </p>
                <ul className="flex flex-col gap-1 font-mono text-xs text-cosmos-muted">
                  {recorded.entries.map((e) => (
                    <li key={e.kepoi_name}>
                      <span className="text-cosmos-text">{e.kepoi_name}</span> — {e.disposition}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={reset}
                  className="mt-1 self-start font-mono text-xs text-cosmos-nebula transition-colors hover:text-cosmos-text"
                >
                  ← 다른 별 사냥하기
                </button>
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
            </>
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
