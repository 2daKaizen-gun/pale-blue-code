import type { KOIMatch } from '../../lib/api/hunt'

interface Props {
  kicId: number
  period: number
  matches: KOIMatch[]
}

const DISPOSITION_STYLE: Record<string, { badge: string; label: string }> = {
  CANDIDATE: {
    badge: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    label: 'UNCONFIRMED CANDIDATE',
  },
  CONFIRMED: {
    badge: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
    label: 'CONFIRMED PLANET',
  },
  'FALSE POSITIVE': {
    badge: 'border-cosmos-border bg-cosmos-bg text-cosmos-muted',
    label: 'FALSE POSITIVE',
  },
}

export default function KOIMatchCard({ kicId, period, matches }: Props) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-purple-500/50 bg-purple-500/10 p-5">
        <span className="inline-block rounded border border-purple-400/50 bg-purple-500/10 px-2 py-0.5 font-mono text-xs tracking-widest text-purple-300">
          NOT IN KOI CATALOG
        </span>
        <p className="mt-3 text-lg font-semibold text-cosmos-text">
          이 신호는 KOI 카탈로그에 없습니다
        </p>
        <p className="mt-1 text-sm text-cosmos-muted">
          {period.toFixed(3)}일 주기 신호가 NASA KOI 카탈로그에 등록되어 있지 않습니다 — 아직
          아무도 기록하지 않은 후보일 수 있습니다. 후속 분석으로 행성·쌍성·노이즈를 가려야 합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs">
          <a
            href="https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-cosmos-border px-3 py-1.5 text-cosmos-nebula transition-colors hover:border-cosmos-nebula"
          >
            Planet Hunters →
          </a>
          <a
            href="https://exoplanetarchive.ipac.caltech.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-cosmos-border px-3 py-1.5 text-cosmos-nebula transition-colors hover:border-cosmos-nebula"
          >
            NASA Exoplanet Archive →
          </a>
        </div>
      </div>
    )
  }

  const hasConfirmed = matches.some((m) => m.disposition === 'CONFIRMED')
  const headline = hasConfirmed
    ? '이미 확인된 행성입니다 — 우리 알고리즘도 동일하게 찾았습니다'
    : '아직 확인되지 않은 행성 후보와 일치합니다'

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-elevated p-5">
      <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
        KOI CROSS-CHECK — KIC {kicId}
      </p>
      <p className="mb-4 text-lg font-semibold text-cosmos-text">{headline}</p>
      <ul className="flex flex-col gap-3">
        {matches.map((m) => {
          const style = DISPOSITION_STYLE[m.disposition] ?? DISPOSITION_STYLE['FALSE POSITIVE']
          return (
            <li
              key={m.kepoi_name}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-cosmos-border bg-cosmos-bg p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block rounded border px-2 py-0.5 font-mono text-xs tracking-widest ${style.badge}`}
                >
                  {style.label}
                </span>
                <span className="font-mono text-sm text-cosmos-text">{m.kepoi_name}</span>
              </div>
              <span className="font-mono text-xs text-cosmos-muted">
                catalog period {m.koi_period.toFixed(3)}d · BLS {period.toFixed(3)}d
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
