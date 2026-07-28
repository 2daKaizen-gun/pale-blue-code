import { Link } from 'react-router-dom'

/**
 * Phase 10 — Skyward. The frontier hub: one discoverable entry that lets a hunter
 * choose the sky before hunting. Kepler stared at 0.25% of the sky for four years
 * (deep); TESS sweeps ~85% but only ~27 days per sector (shallow). Each choice
 * lands on the same mission-aware hunt (/hunt/frontier/:mission), which frames its
 * own trade honestly. This page is deliberately NOT in phases.ts — it is reached
 * via a separate nav element, keeping the frontier off the auto-derived phase nav.
 */
interface SkyCard {
  to: string
  emoji: string
  title: string
  tagline: string
  stats: { label: string; value: string }[]
  body: string
}

const SKIES: SkyCard[] = [
  {
    to: '/hunt/frontier/kepler',
    emoji: '🔭',
    title: 'Kepler',
    tagline: '깊게 본 하나의 창',
    stats: [
      { label: '하늘', value: '0.25%' },
      { label: '관측 기간', value: '~4년' },
      { label: '판별', value: '깊게' },
    ],
    body: '한 조각 하늘을 4년간 응시했습니다. 긴 관측선 덕에 반복 통과가 많아 네 관문이 날카롭게 섭니다 — 강한 신호는 그대로 강합니다.',
  },
  {
    to: '/hunt/frontier/tess',
    emoji: '🛰️',
    title: 'TESS',
    tagline: '온 하늘을 얕게 훑다',
    stats: [
      { label: '하늘', value: '~85%' },
      { label: '관측 기간', value: '~27일/구역' },
      { label: '판별', value: '얕게' },
    ],
    body: '거의 온 하늘을 훑지만 한 구역을 겨우 27일 봅니다. 통과 횟수가 적어 판별이 무뎌질 수 있어 — 근거가 얇으면 강한 신호도 "잠정"으로 낮춰 정직하게 표시합니다.',
  },
]

export default function FrontierHubPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 font-mono text-xs tracking-widest text-cosmos-muted">
          FRONTIER · SKYWARD
        </p>
        <h1 className="mb-1 text-3xl font-semibold text-cosmos-text">어느 하늘을 사냥할까요?</h1>
        <p className="text-sm text-cosmos-muted">
          아무도 기록하지 않은 별을 실제로 사냥하는 개척지입니다. 먼저 하늘을 고르세요 — 깊게 본 좁은
          하늘(Kepler)과 얕게 훑은 넓은 하늘(TESS)은 서로 다른 것을 보여줍니다. 판별기는 같지만, 각 하늘이
          무엇을 얼마나 보았는지에 따라 우리가 얼마나 확신할 수 있는지가 달라집니다.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SKIES.map((sky) => (
          <Link
            key={sky.to}
            to={sky.to}
            className="group flex flex-col gap-3 rounded-lg border border-cosmos-border bg-cosmos-surface p-5 transition-colors hover:border-cosmos-nebula hover:bg-cosmos-elevated"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{sky.emoji}</span>
              <div>
                <p className="text-lg font-semibold text-cosmos-text">{sky.title}</p>
                <p className="font-mono text-xs tracking-widest text-cosmos-muted">{sky.tagline}</p>
              </div>
            </div>

            <dl className="flex flex-wrap gap-x-5 gap-y-1">
              {sky.stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <dt className="font-mono text-[10px] tracking-widest text-cosmos-subtle">
                    {s.label}
                  </dt>
                  <dd className="font-mono text-sm text-cosmos-text">{s.value}</dd>
                </div>
              ))}
            </dl>

            <p className="text-sm text-cosmos-muted">{sky.body}</p>

            <span className="mt-1 self-start font-mono text-xs text-cosmos-nebula transition-colors group-hover:text-cosmos-text">
              {sky.title}로 사냥 →
            </span>
          </Link>
        ))}
      </div>

      <Link
        to="/hunt/monotransit"
        className="group flex flex-col gap-2 rounded-lg border border-cosmos-nebula/30 bg-cosmos-elevated p-5 transition-colors hover:border-cosmos-nebula hover:bg-cosmos-surface"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛰️</span>
          <div>
            <p className="text-lg font-semibold text-cosmos-text">단일 트랜짓 사냥</p>
            <p className="font-mono text-xs tracking-widest text-cosmos-muted">기계가 놓친 한 번의 통과</p>
          </div>
        </div>
        <p className="text-sm text-cosmos-muted">
          한 별을 고르는 대신, 개척지 풀 전체에 단일 트랜짓 탐색을 돌립니다. 딥이 반복돼야 잡는
          자동 파이프라인이 눈먼 곳 — 딱 한 번 스친 통과를 겨눕니다. 대부분 빈손이고, 그게 정직한
          결과입니다.
        </p>
        <span className="mt-1 self-start font-mono text-xs text-cosmos-nebula transition-colors group-hover:text-cosmos-text">
          풀 전체 사냥 →
        </span>
      </Link>

      <p className="mt-2 text-xs text-cosmos-subtle">
        판별기를 배우려면 알려진 사례로 시작하세요 —{' '}
        <Link to="/hunt" className="text-cosmos-nebula hover:text-cosmos-text">
          Hunt(시연용 데모)
        </Link>
      </p>
    </div>
  )
}
