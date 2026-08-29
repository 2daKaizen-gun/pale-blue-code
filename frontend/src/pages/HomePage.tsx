import { Link } from 'react-router-dom'
import ApodWidget from '../components/apod/ApodWidget'

/**
 * 홈 = 두 갈래 허브. 맨 위에서 배우기/사냥하기 두 진입점만 제시하고, 여정의
 * 상세(8단계 카드)는 사이드바 '배우기' 섹션이 담당한다 — 홈을 짧고 명확하게.
 *
 * ⚠️ 사냥하기 진입은 또 하나의 수업이 아니라 수업을 떠나는 것(분리 불변식). 옛
 *    FrontierCTA의 정직한 프레이밍(대부분 빈손이지만 진짜 개척)을 이 카드가 잇는다.
 */
export default function HomePage() {
  return (
    <div className="max-w-5xl">
      {/* 헤더 */}
      <header className="mb-10">
        <p className="text-cosmos-muted font-mono text-xs tracking-widest mb-2">
          PALE BLUE CODE
        </p>
        <h1 className="text-cosmos-text text-3xl font-semibold mb-3">
          가장 작은 단위로 가장 큰 질문에
        </h1>
        <p className="text-cosmos-muted text-sm leading-relaxed">
          비트가 모여 의미가 되고, 알고리즘이 우주를 그린다.<br />
          두 갈래 중 하나로 시작하세요 — 배우거나, 직접 사냥하거나.
        </p>
      </header>

      {/* 두 진입점 — 홈의 주된 선택 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {/* 배우기 */}
        <Link
          to="/solar"
          className="group flex flex-col rounded-lg border border-cosmos-border bg-cosmos-surface p-6 transition-all hover:border-cosmos-nebula hover:bg-cosmos-elevated"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl" aria-hidden>📖</span>
            <span className="text-cosmos-text text-xl font-semibold">배우기</span>
            <span className="text-cosmos-subtle font-mono text-xs tracking-widest ml-1">
              THE JOURNEY
            </span>
          </div>
          <p className="text-cosmos-muted text-sm leading-relaxed flex-1">
            행성을 어떻게 찾는지, 인류가 우주를 이해해온 순서 그대로 —
            태양계에서 신호까지 여덟 단계를 차근차근.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm text-cosmos-text group-hover:text-cosmos-nebula transition-colors">
            여정 시작 <span aria-hidden>→</span>
          </span>
        </Link>

        {/* 사냥하기 — 진짜 도구(강조). 옛 FrontierCTA의 정직한 프레이밍을 잇는다. */}
        <Link
          to="/hunt/frontier"
          className="group flex flex-col rounded-lg border border-cosmos-nebula/30 bg-gradient-to-br from-cosmos-elevated to-cosmos-surface p-6 transition-all hover:border-cosmos-nebula"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl" aria-hidden>🛰️</span>
            <span className="text-cosmos-text text-xl font-semibold">사냥하기</span>
            <span className="text-cosmos-nebula font-mono text-xs tracking-widest ml-1">
              THE FRONTIER · 라이브
            </span>
          </div>
          <p className="text-cosmos-muted text-sm leading-relaxed flex-1">
            진짜 하늘에서 직접. 아직 아무도 후보로 지목하지 않은 별을 우리 손으로 엽니다.
            자동 파이프라인이 눈먼 틈을 겨눕니다 — 대부분은 빈손이지만, 그게 진짜 개척입니다.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm text-cosmos-text group-hover:text-cosmos-nebula transition-colors">
            개척지로 들어가기 <span aria-hidden>→</span>
          </span>
        </Link>
      </section>

      {/* 구분선 */}
      <div className="border-t border-cosmos-border mb-12" />

      {/* 오늘의 하늘 — 매일 바뀌는 곁들임 */}
      <section>
        <h2 className="text-cosmos-nebula font-mono text-xs tracking-widest mb-6">
          ASTRONOMY PICTURE OF THE DAY · 오늘의 하늘
        </h2>
        <ApodWidget />
      </section>
    </div>
  )
}
