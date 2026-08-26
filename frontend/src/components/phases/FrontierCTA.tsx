import { Link } from 'react-router-dom'

/**
 * The landing-page call into the real hunt (Phase 9-B / 10 / 11 — the "Skyward"
 * track). Deliberately NOT a roadmap card and NOT derived from constants/phases.ts:
 * the roadmap retraces how humanity came to understand the sky (a lesson, Phases
 * 0-8), while the frontier is us leaving the lesson to open unrecorded stars. Same
 * separation invariant the nav honours (AppLayout's hand-placed 🛰️ link). This is
 * its landing-page presence — sitting *beneath* the roadmap, framed as "beyond it".
 *
 * Honesty (nails 1 & 3): it promises a real hunt, not a discovery. Most stars come
 * back empty; that is said plainly, so the CTA reads as an invitation to look, not
 * a claim to have found.
 */
export default function FrontierCTA() {
  return (
    <section className="mt-16">
      <div className="rounded-lg border border-cosmos-nebula/30 bg-gradient-to-br from-cosmos-elevated to-cosmos-surface p-6 md:p-8">
        <p className="text-cosmos-nebula font-mono text-xs tracking-widest mb-3">
          로드맵 너머 — 진짜 사냥
        </p>
        <h2 className="text-cosmos-text text-2xl font-semibold mb-4 flex items-center gap-2">
          <span aria-hidden>🛰️</span>
          기계가 놓친 곳으로
        </h2>
        <p className="text-cosmos-muted text-sm leading-relaxed mb-6 max-w-2xl">
          여기까지는 인류가 우주를 이해해온 길을 코드로 다시 그렸습니다. 이제부터는 따라
          그리지 않습니다 — 아직 아무도 후보로 지목하지 않은 별을, 우리 손으로 직접 엽니다.
          <br className="hidden md:block" />
          자동 파이프라인은 밝기 꺼짐이 여러 번 반복돼야 잡습니다. 우리는 그 기계가 눈먼 틈을
          겨눕니다. 대부분은 빈손입니다 — 그래도 그게 진짜 개척입니다.
        </p>
        <Link
          to="/hunt/frontier"
          className="inline-flex items-center gap-2 rounded border border-cosmos-nebula/40 bg-cosmos-nebula/10 px-4 py-2 text-sm text-cosmos-text transition-colors hover:bg-cosmos-nebula/20"
        >
          개척지로 들어가기
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}
