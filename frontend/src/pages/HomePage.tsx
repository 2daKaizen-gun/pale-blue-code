import ApodWidget from '../components/apod/ApodWidget'
import PhaseCard from '../components/phases/PhaseCard'
import FrontierCTA from '../components/phases/FrontierCTA'
import { PHASES } from '../constants/phases'
import { learnPhases } from '../components/layout/navModel'

// 토대 단계(Phase 0·1)는 전용 페이지가 없어 path='/' → 카드로 두면 홈으로
// 되돌아오는 죽은 바로가기가 된다. 카드에서 빼되, 완료된 사실은 한 줄로 남긴다.
const foundationPhases = PHASES.filter((p) => p.path === '/')

export default function HomePage() {
  return (
    <div className="max-w-5xl">
      {/* 헤더 */}
      <header className="mb-12">
        <p className="text-cosmos-muted font-mono text-xs tracking-widest mb-2">
          PALE BLUE CODE
        </p>
        <h1 className="text-cosmos-text text-3xl font-semibold mb-3">
          가장 작은 단위로 가장 큰 질문에
        </h1>
        <p className="text-cosmos-muted text-sm leading-relaxed">
          비트가 모여 의미가 되고, 알고리즘이 우주를 그린다.<br />
          NASA가 매일 보내주는 우주의 한 장면으로 시작하자.
        </p>
      </header>

      {/* 구분선 */}
      <div className="border-t border-cosmos-border mb-12" />

      {/* APOD 섹션 */}
      <section className="mb-16">
        <h2 className="text-cosmos-nebula font-mono text-xs tracking-widest mb-6">
          ASTRONOMY PICTURE OF THE DAY
        </h2>
        <ApodWidget />
      </section>

      {/* 구분선 */}
      <div className="border-t border-cosmos-border mb-12" />

      {/* 바로가기 — 홈 하단은 네비의 두 갈래(배우기 / 사냥하기)를 그대로 비춘다.
          여기는 '배우기': 클릭 가능한 여정 카드만(learnPhases, nav와 같은 소스). */}
      <section>
        <h2 className="text-cosmos-nebula font-mono text-xs tracking-widest mb-2">
          📖 배우기 — ROADMAP
        </h2>
        <p className="text-cosmos-muted text-sm mb-3">
          인류가 우주를 이해해온 순서를 그대로 코드로 다시 그린다. 아래 단계를 순서대로
          따라가면 된다.
        </p>

        {/* 토대(Phase 0·1)는 완료된 사실만 한 줄로 — 클릭 대상 아님 */}
        {foundationPhases.length > 0 && (
          <p className="text-cosmos-subtle text-xs mb-8">
            토대는 이미 놓였습니다 ·{' '}
            {foundationPhases.map((p, i) => (
              <span key={p.number}>
                {i > 0 && ' · '}
                {p.emoji} {p.title}
              </span>
            ))}{' '}
            <span className="text-cosmos-aurora">✓ 완료</span>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learnPhases.map((phase) => (
            <PhaseCard key={phase.number} phase={phase} />
          ))}
        </div>
      </section>

      {/* '사냥하기' 진입 — 로드맵 격자 밖에 두는 분리 불변식: 개척지는 또 하나의
          수업이 아니라, 수업을 떠나는 것. (nav의 손배치 🛰️ 링크와 같은 원칙) */}
      <FrontierCTA />
    </div>
  )
}
