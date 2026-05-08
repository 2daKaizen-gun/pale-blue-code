import ApodWidget from '../components/apod/ApodWidget'
import PhaseCard from '../components/phases/PhaseCard'
import { PHASES } from '../constants/phases'

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

      {/* 로드맵 섹션 */}
      <section>
        <h2 className="text-cosmos-nebula font-mono text-xs tracking-widest mb-2">
          ROADMAP
        </h2>
        <p className="text-cosmos-muted text-sm mb-8">
          인류가 우주를 이해해온 순서를 그대로 코드로 다시 그린다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PHASES.map((phase) => (
            <PhaseCard key={phase.number} phase={phase} />
          ))}
        </div>
      </section>
    </div>
  )
}
