import type { FrontierStar } from '../../lib/api/hunt'
import { brightness, daysAgo, lightYears, warmth } from './starCopy'
import Reveal from '../ui/Reveal'

/**
 * The first-look moment (Phase 10 sub-10-4). When a frontier star is picked, before
 * any verdict, name what we're about to look at — where it sits, how bright, sun-like
 * or not, how far — and the honest hook: it is absent from the TOI planet catalog, and
 * its newest TESS data landed N days ago, so you can be the first to vet it and call it
 * a candidate. NB (nail #3): a bright unrecorded star has usually been *observed* across
 * many sectors — so we claim "not yet flagged as a candidate," never "never seen." Every
 * line is strictly stellar (via starCopy), so the reveal never hints at a planet.
 *
 * Rendered with a `key={star.tic}` upstream so each new pick remounts and replays the
 * reveal animation.
 */
interface Props {
  star: FrontierStar
}

export default function FirstLook({ star }: Props) {
  const d = daysAgo(star.observed_at)
  const ly = lightYears(star.distance_pc)
  const facts = [
    star.constellation && `${star.constellation} 방향`,
    warmth(star.teff),
    brightness(star.tmag),
    ly != null && `약 ${ly.toLocaleString()}광년`,
  ].filter(Boolean) as string[]

  return (
    <Reveal>
      <div className="flex flex-col gap-3 rounded-lg border border-cosmos-nebula bg-cosmos-elevated p-5">
        <span className="font-mono text-xs tracking-widest text-cosmos-nebula">
          첫 판별 · FIRST VET
        </span>
        <p className="font-mono text-lg text-cosmos-text">TIC {star.tic}</p>
        {facts.length > 0 && (
          <p className="text-sm text-cosmos-muted">{facts.join(' · ')}</p>
        )}
        <p className="text-sm text-cosmos-text">
          이 별은 아직 어떤 행성 카탈로그(TOI)에도 오르지 않았습니다.
          {d != null && (
            <>
              {' '}가장 최근 TESS 관측은 <span className="text-cosmos-nebula">{d}일 전</span>.
            </>
          )}{' '}
          직접 판별해, 당신이 처음으로 후보에 올릴 수 있습니다.
        </p>
      </div>
    </Reveal>
  )
}
