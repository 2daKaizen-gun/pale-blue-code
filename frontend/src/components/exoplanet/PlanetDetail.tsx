import { Link } from 'react-router-dom'
import type { Planet } from '../../lib/api/exoplanet'

interface Props {
  planet: Planet
  onClose: () => void
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cosmos-border/50 py-2">
      <span className="shrink-0 font-mono text-xs text-cosmos-muted">{label}</span>
      <span className="text-right text-xs text-cosmos-text">
        {value !== null ? String(value) : '—'}
      </span>
    </div>
  )
}

export default function PlanetDetail({ planet, onClose }: Props) {
  return (
    <div className="absolute right-0 top-0 z-20 w-72 rounded-lg border border-cosmos-border bg-cosmos-surface p-4 shadow-xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-0.5 font-mono text-xs tracking-widest text-cosmos-muted">외계행성</p>
          <h2 className="text-base font-semibold text-cosmos-text">{planet.pl_name}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="상세 패널 닫기"
          className="mt-0.5 text-lg leading-none text-cosmos-muted transition-colors hover:text-cosmos-text"
        >
          ✕
        </button>
      </div>

      <Row label="모항성" value={planet.hostname} />
      <Row label="발견 방법" value={planet.discoverymethod} />
      <Row label="발견 연도" value={planet.disc_year} />
      <Row label="발견 기관" value={planet.disc_facility} />
      <Row
        label="공전 주기"
        value={planet.pl_orbper !== null ? `${planet.pl_orbper.toFixed(3)}일` : null}
      />
      <Row
        label="반지름"
        value={planet.pl_rade !== null ? `지구의 ${planet.pl_rade.toFixed(3)}배` : null}
      />
      <Row
        label="질량"
        value={planet.pl_masse !== null ? `지구의 ${planet.pl_masse.toFixed(3)}배` : null}
      />
      <Row
        label="평형 온도"
        value={planet.pl_eqt !== null ? `${Math.round(planet.pl_eqt)} K` : null}
      />
      <Row
        label="거리"
        value={planet.sy_dist !== null ? `${planet.sy_dist.toFixed(1)} pc` : null}
      />
      <Row
        label="항성 온도"
        value={planet.st_teff !== null ? `${Math.round(planet.st_teff)} K` : null}
      />
      <Row label="항성계 내 행성" value={planet.sy_pnum} />

      <Link
        to={`/data?planet=${encodeURIComponent(planet.pl_name)}`}
        className="mt-4 flex w-full items-center justify-center rounded-lg border border-cosmos-border bg-cosmos-bg px-3 py-2 font-mono text-xs text-cosmos-muted transition-colors hover:border-cosmos-nebula hover:text-cosmos-text"
      >
        광도곡선 보기 →
      </Link>
    </div>
  )
}
