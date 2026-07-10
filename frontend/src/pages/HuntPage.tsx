import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchHuntTargets,
  fetchHuntLC,
  fetchHuntBLS,
  fetchKOICheck,
  fetchVetting,
  type HuntTarget,
  type KOIMatch,
  type VettingReport,
} from '../lib/api/hunt'
import type { BLSData } from '../lib/api/bls'
import Spinner from '../components/ui/Spinner'
import HuntTargetCard from '../components/hunt/HuntTargetCard'
import KOIMatchCard from '../components/hunt/KOIMatchCard'
import DiscoveryActions from '../components/hunt/DiscoveryActions'
import VettingReportCard from '../components/hunt/VettingReport'
import Reveal from '../components/ui/Reveal'
import PeriodogramChart from '../components/signal/PeriodogramChart'
import BLSResultCard from '../components/signal/BLSResultCard'

export default function HuntPage() {
  const [targets, setTargets] = useState<HuntTarget[]>([])
  const [selectedKic, setSelectedKic] = useState<number | null>(null)

  const [lcLoading, setLcLoading] = useState(false)
  const [blsLoading, setBlsLoading] = useState(false)
  const [koiLoading, setKoiLoading] = useState(false)
  const [vetLoading, setVetLoading] = useState(false)

  const [blsData, setBlsData] = useState<BLSData | null>(null)
  const [koiMatches, setKoiMatches] = useState<KOIMatch[] | null>(null)
  const [vetReport, setVetReport] = useState<VettingReport | null>(null)
  const [vetError, setVetError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [manualKic, setManualKic] = useState('')

  useEffect(() => {
    fetchHuntTargets().then(setTargets).catch(() => {})
  }, [])

  const busy = lcLoading || blsLoading || koiLoading

  // Sequential hunt: LC -> BLS -> KOI cross-check. Triggered by user action
  // (card click / manual submit), never from an effect — all setState lives in
  // this async callback, not synchronously in render.
  const runHunt = useCallback(async (kicId: number) => {
    setSelectedKic(kicId)
    setError(null)
    setBlsData(null)
    setKoiMatches(null)
    setVetReport(null)
    setVetError(null)

    const fail = (e: unknown) =>
      setError(e instanceof Error ? e.message : 'Unknown error')

    // Step 1: prime the backend LC cache so the BLS endpoint won't 424.
    // The light curve itself is not displayed — BLS re-reads it server-side.
    setLcLoading(true)
    try {
      await fetchHuntLC(kicId)
    } catch (e) {
      fail(e)
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

    // Step 3: KOI cross-check and the four-gate vetting run in parallel — both
    // consume the BLS result but neither depends on the other. Vetting failure is
    // isolated to vetError so a vet miss never blanks the BLS/KOI results.
    setKoiLoading(true)
    setVetLoading(true)

    const koiRun = fetchKOICheck(kicId, bls.best.period)
      .then(setKoiMatches)
      .catch(fail)
      .finally(() => setKoiLoading(false))

    const vetRun = fetchVetting(kicId)
      .then(setVetReport)
      .catch((e) => setVetError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setVetLoading(false))

    await Promise.all([koiRun, vetRun])
  }, [])

  const reset = () => {
    setSelectedKic(null)
    setBlsData(null)
    setKoiMatches(null)
    setVetReport(null)
    setVetError(null)
    setError(null)
  }

  const submitManual = () => {
    const kic = Number(manualKic.trim())
    if (!Number.isInteger(kic) || kic <= 0) {
      setSelectedKic(-1)
      setError('유효한 KIC 번호를 입력하세요 (예: 11442793)')
      return
    }
    runHunt(kic)
  }

  const loadingMessage = lcLoading
    ? '케플러 광도곡선 수신 중…'
    : blsLoading
      ? '65,000개 밝기 측정값에서 반복 신호 탐색 중…'
      : 'NASA KOI 카탈로그와 대조 중…'

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">PHASE 08</p>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">Hunt</h1>
        <p className="text-sm text-cosmos-muted">
          케플러 데이터에서 아직 확인되지 않은 신호를 찾는다 — 별을 고르고, BLS를 겨냥하고, KOI
          카탈로그와 대조한다
        </p>
      </header>

      {selectedKic === null ? (
        <>
          <div className="rounded-lg border border-cosmos-border bg-cosmos-surface p-4">
            <p className="font-mono text-xs tracking-widest text-cosmos-muted">
              DEMO TARGETS — 알려진 사례
            </p>
            <p className="mt-1 text-sm text-cosmos-muted">
              아래 별들은 이미 카탈로그에 등록된 <span className="text-cosmos-text">알려진 KOI</span>입니다 —
              발견이 아니라 판별기를 배우기 위한 시연용. 직접 판정해보고 NASA 결론과 대조해보세요.
              아무도 기록하지 않은 별을 실제로 사냥하는 단독 탐색은{' '}
              <Link to="/hunt/frontier" className="text-cosmos-nebula hover:text-cosmos-text">
                Frontier(9-B)
              </Link>
              에서 열립니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {targets.map((t) => (
              <HuntTargetCard key={t.kic_id} target={t} onSelect={runHunt} />
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
            <p className="font-mono text-xs tracking-widest text-cosmos-muted">
              ADVANCED — 자유 탐색
            </p>
            <p className="text-sm text-cosmos-muted">KIC 번호를 직접 입력해 임의의 케플러 별을 사냥하세요.</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={manualKic}
                onChange={(e) => setManualKic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitManual()}
                placeholder="KIC 11442793"
                className="w-full rounded-lg border border-cosmos-border bg-cosmos-bg px-3 py-2 font-mono text-sm text-cosmos-text placeholder:text-cosmos-subtle focus:border-cosmos-nebula focus:outline-none sm:w-56"
              />
              <button
                onClick={submitManual}
                disabled={!manualKic.trim()}
                className="w-full rounded-lg border border-cosmos-nebula bg-cosmos-elevated px-4 py-2 font-mono text-sm text-cosmos-nebula transition-colors hover:bg-cosmos-nebula hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                HUNT
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <button
            onClick={reset}
            disabled={busy}
            className="self-start font-mono text-xs text-cosmos-nebula transition-colors hover:text-cosmos-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← 타깃 목록으로
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
            <div className="flex min-h-[20vh] items-center justify-center font-mono text-sm text-red-400">
              ERROR: {error}
            </div>
          )}

          {!busy && !error && blsData && (
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
                  <VettingReportCard report={vetReport} />
                </Reveal>
              )}

              {koiMatches !== null && (
                <>
                  <Reveal>
                    <KOIMatchCard
                      kicId={selectedKic}
                      period={blsData.best.period}
                      matches={koiMatches}
                    />
                  </Reveal>
                  <Reveal delay={80}>
                    <DiscoveryActions
                      kicId={selectedKic}
                      bls={blsData}
                      matches={koiMatches}
                      vetReport={vetReport}
                    />
                  </Reveal>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
