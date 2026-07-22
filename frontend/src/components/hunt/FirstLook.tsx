import type { FrontierStar } from '../../lib/api/hunt'
import { brightness, daysAgo, lightYears, warmth } from './starCopy'
import Reveal from '../ui/Reveal'

/**
 * The first-look moment (Phase 10 sub-10-4). When a frontier star is picked, before
 * any verdict, name what we're about to look at — where it sits, how bright, sun-like
 * or not, how far — and the whole point: how many days ago its light reached TESS with
 * nobody having looked. This is the novelty framed in *time*, not space. Every line is
 * strictly stellar (via starCopy), so the reveal never hints at a planet (nail #3).
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
          첫 관측 · FIRST LOOK
        </span>
        <p className="font-mono text-lg text-cosmos-text">TIC {star.tic}</p>
        {facts.length > 0 && (
          <p className="text-sm text-cosmos-muted">{facts.join(' · ')}</p>
        )}
        <p className="text-sm text-cosmos-text">
          {d != null ? (
            <>
              이 별빛은 <span className="text-cosmos-nebula">{d}일 전</span> TESS에 도착했고,
              아직 아무도 들여다보지 않았습니다.
            </>
          ) : (
            <>이 별은 아직 어떤 카탈로그에도 없습니다.</>
          )}{' '}
          지금부터는 당신이 처음입니다.
        </p>
      </div>
    </Reveal>
  )
}
