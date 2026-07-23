import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { PHASES } from '../../constants/phases'
import Spinner from '../ui/Spinner'
import BackendStatusBanner from '../system/BackendStatusBanner'

// Phase 0, 1은 둘 다 path='/' 이므로 네비에서는 1개만 (Home)
const navPhases = PHASES.filter((p, i, arr) =>
  arr.findIndex((x) => x.path === p.path) === i
)

/**
 * ─── sub-phase 2-7 [L6] 변경 ───────────────────────
 *   <Outlet /> 을 <Suspense> 로 감쌈. router.tsx 의 lazy 페이지 로딩 중 Spinner.
 *
 * ─── sub-phase 2-7 [L8] 변경 (모바일 반응형) ──────────
 *   사이드바: md(768px) 이상 = 상시 표시(w-48, 레이아웃 안). md 미만 = 화면 밖
 *   드로어(fixed, -translate-x-full)로 숨기고 좌상단 햄버거로 토글.
 *   *너비 기반*(md) 으로 — 터치 여부가 아니라 *공간* 문제라서, 좁은 데스크톱
 *   창에서도 같이 접힘. backdrop 탭 / nav 링크 탭 시 닫힘.
 *   main 에 min-w-0 — flex 자식이 캔버스를 위해 정상 축소되도록 (overflow 방지).
 */
export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = () => setNavOpen(false)

  return (
    <div className="min-h-screen flex bg-cosmos-bg text-cosmos-text font-sans">
      {/* 햄버거 토글 — 모바일 전용 */}
      <button
        type="button"
        onClick={() => setNavOpen((v) => !v)}
        aria-label={navOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={navOpen}
        className="fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-cosmos-border bg-cosmos-surface/80 text-cosmos-text backdrop-blur-md md:hidden"
      >
        {navOpen ? '✕' : '☰'}
      </button>

      {/* backdrop — 모바일 드로어 열렸을 때 */}
      {navOpen && (
        <div
          onClick={closeNav}
          aria-hidden
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      {/* 사이드 네비게이션 — 모바일 드로어 / 데스크톱 상시 */}
      <nav
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col gap-1 p-4 border-r border-cosmos-border bg-cosmos-surface transition-transform duration-200 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-auto md:w-48 md:min-h-screen md:translate-x-0 md:transition-none`}
      >
        {/* 로고 */}
        <div className="px-3 py-4 mb-2 border-b border-cosmos-border">
          <span className="text-cosmos-nebula font-mono text-sm font-bold tracking-widest">
            PALE BLUE
          </span>
          <br />
          <span className="text-cosmos-muted font-mono text-xs tracking-widest">
            CODE
          </span>
        </div>

        {navPhases.map((phase) => (
          <NavLink
            key={phase.path}
            to={phase.path}
            // `end` on every phase link: each is a leaf route, so it should be
            // active only on its exact path. Without it, /hunt lights up on the
            // /hunt/frontier* child routes too (the separate Frontier link below
            // deliberately omits `end` so it stays active across its :mission children).
            end
            onClick={closeNav}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-cosmos-elevated text-cosmos-text'
                  : 'text-cosmos-muted hover:text-cosmos-text hover:bg-cosmos-elevated'
              }`
            }
          >
            <span>{phase.emoji}</span>
            <span>{phase.path === '/' ? 'Home' : phase.title}</span>
          </NavLink>
        ))}

        {/* Frontier — deliberately a SEPARATE nav element, NOT derived from
            PHASES (constants/phases.ts). The real solo hunt is its own track
            (Skyward, Phase 10), so it must not sit inside the numbered phase nav;
            this hand-placed link gives it discoverability without that coupling. */}
        <NavLink
          to="/hunt/frontier"
          onClick={closeNav}
          className={({ isActive }) =>
            `mt-1 px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 border-t border-cosmos-border pt-3 ${
              isActive
                ? 'bg-cosmos-elevated text-cosmos-text'
                : 'text-cosmos-muted hover:text-cosmos-text hover:bg-cosmos-elevated'
            }`
          }
        >
          <span>🛰️</span>
          <span>Frontier</span>
        </NavLink>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0">
        {/* 백엔드가 죽었거나 잘못 설정되면 조용한 빈 화면 대신 여기서 알림 */}
        <BackendStatusBanner />
        <div className="p-4 md:p-8">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
        </div>
      </main>
    </div>
  )
}
