import { Link } from 'react-router-dom'
import SingleTransitHunt from '../components/hunt/SingleTransitHunt'

/**
 * The frontier front door (rebuilt 2026-08-06). It used to be a maze: a menu of five links —
 * "어느 하늘을 사냥할까요?" over Kepler, TESS, the single-transit hunt, the pool, and a demo — with
 * six competing words and no story, so a newcomer could not tell which was which or where to start.
 *
 * Now it is one narrated page with the honest north star up top. The single-transit hunt — the
 * thing the machines actually miss — runs INLINE (the sub-11-12 disk memo makes it an instant
 * read, so the entry page shows real results, not a spinner). Below it: which stars we aimed at
 * and why, then "how we got here" — the repeating-signal hunt and the teaching demo, framed as the
 * road that led here, not rival hunts. Deliberately NOT in phases.ts (the frontier/roadmap split).
 */

// The paths that led to the single-transit hunt — demoted from rival front doors to "how we got
// here". The repeating-signal hunt is what the machines already do well; the demo is where the
// discriminators were learned on known stars. Context for the real hunt above, not competition.
interface PriorStep {
  to: string
  emoji: string
  title: string
  body: string
}

const PRIOR_STEPS: PriorStep[] = [
  {
    to: '/hunt/frontier/kepler',
    emoji: '🔭',
    title: '반복 신호 사냥 — Kepler',
    body: '한 조각 하늘을 4년간 응시한 데이터. 여러 번 반복되는 통과를 찾습니다 — 기계가 이미 잘 하는 일이지만, 판별기가 가장 날카롭게 서는 하늘입니다.',
  },
  {
    to: '/hunt/frontier/tess',
    emoji: '🛰️',
    title: '반복 신호 사냥 — TESS',
    body: '거의 온 하늘을 얕게 훑은 데이터. 한 구역을 겨우 27일 봐서 통과 횟수가 적고, 그래서 강한 신호도 근거가 얇으면 “잠정”으로 정직하게 낮춥니다.',
  },
  {
    to: '/hunt',
    emoji: '📖',
    title: '알려진 예제로 배우기',
    body: '이미 카탈로그에 오른 별로 판별기를 연습하는 시연용. 발견이 아니라, 위 사냥이 무엇을 어떻게 판정하는지 배우는 곳입니다.',
  },
]

export default function FrontierHubPage() {
  return (
    <div className="flex flex-col gap-10">
      {/* The real hunt, inline and live — the honest north star leads. */}
      <SingleTransitHunt />

      {/* Which stars, and why these — the pool triage, as context for the hunt above. */}
      <section>
        <Link
          to="/hunt/pool"
          className="group flex items-center justify-between gap-3 rounded-lg border border-cosmos-border bg-cosmos-surface px-5 py-3 transition-colors hover:border-cosmos-nebula hover:bg-cosmos-elevated"
        >
          <span className="flex items-center gap-3">
            <span className="text-xl" aria-hidden>🎯</span>
            <span>
              <span className="text-sm font-semibold text-cosmos-text">왜 이 별들을 봤나</span>
              <span className="ml-2 font-mono text-[11px] text-cosmos-muted">
                풀에서 행성 크기 표적을 먼저 가려냅니다 →
              </span>
            </span>
          </span>
        </Link>
      </section>

      {/* How we got here — the earlier paths, demoted to the journey that led to the hunt above. */}
      <section className="flex flex-col gap-4 border-t border-cosmos-border pt-8">
        <div>
          <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
            여기까지 온 길
          </p>
          <p className="max-w-2xl text-sm text-cosmos-muted">
            위 사냥은 갑자기 나오지 않았습니다. 먼저 <strong className="text-cosmos-text">반복되는</strong>{' '}
            신호를 사냥하며 판별기를 벼렸고 — 그건 기계가 이미 잘 하는 일이었습니다 — 그다음에야
            기계가 눈먼 <strong className="text-cosmos-text">한 번의</strong> 통과로 옮겨왔습니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRIOR_STEPS.map((step) => (
            <Link
              key={step.to}
              to={step.to}
              className="group flex flex-col gap-2 rounded-lg border border-cosmos-border bg-cosmos-surface p-4 transition-colors hover:border-cosmos-nebula hover:bg-cosmos-elevated"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{step.emoji}</span>
                <p className="text-sm font-semibold text-cosmos-text">{step.title}</p>
              </div>
              <p className="text-xs text-cosmos-subtle">{step.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
