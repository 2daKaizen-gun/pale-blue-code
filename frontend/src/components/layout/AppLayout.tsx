import { Suspense, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Spinner from '../ui/Spinner'
import BackendStatusBanner from '../system/BackendStatusBanner'
import {
  learnPhases,
  huntItems,
  sectionForPath,
  type NavSection,
} from './navModel'

/**
 * ─── 정보구조: 2계층 네비게이션 ───────────────────────
 *   평평한 9개 링크는 "여정(배우기)"과 "실제 도구(사냥하기)"를 같은 무게로
 *   나열해 처음 온 사람이 무엇이 핵심인지 알 수 없었다. 이제 사이드바는
 *   두 섹션으로 접힌다 (그룹 구성·경로 판정 로직은 navModel.ts, 단위 테스트됨):
 *     📖 배우기   = 선형 학습 여정 (Phase 2~8)
 *     🛰 사냥하기 = 진짜 하늘을 뒤지는 라이브 도구 (Frontier + 표적 풀)
 *   Home 은 두 섹션 위에 상시 노출. 현재 경로가 속한 섹션은 자동으로 열려
 *   "지금 어디 있는가"를 늘 보여준다. 평소 보이는 항목 = Home + 섹션 헤더 2개.
 */
export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = () => setNavOpen(false)

  const { pathname } = useLocation()
  // 현재 경로가 속한 섹션을 자동으로 연다. 사용자가 헤더로 토글도 가능.
  const [openSection, setOpenSection] = useState<NavSection>(() => sectionForPath(pathname))
  const [syncedPath, setSyncedPath] = useState(pathname)
  if (syncedPath !== pathname) {
    setSyncedPath(pathname)
    const s = sectionForPath(pathname)
    if (s) setOpenSection(s)
  }

  const toggleSection = (s: Exclude<NavSection, null>) =>
    setOpenSection((cur) => (cur === s ? null : s))

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
      isActive
        ? 'bg-cosmos-elevated text-cosmos-text'
        : 'text-cosmos-muted hover:text-cosmos-text hover:bg-cosmos-elevated'
    }`

  const headerClass = (open: boolean) =>
    `w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 text-left ${
      open ? 'text-cosmos-text' : 'text-cosmos-muted hover:text-cosmos-text hover:bg-cosmos-elevated'
    }`

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
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col gap-1 p-4 border-r border-cosmos-border bg-cosmos-surface transition-transform duration-200 overflow-y-auto ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-auto md:w-52 md:min-h-screen md:translate-x-0 md:transition-none`}
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

        {/* Home — 상시 노출 */}
        <NavLink to="/" end onClick={closeNav} className={linkClass}>
          <span>🏠</span>
          <span>Home</span>
        </NavLink>

        {/* ── 배우기 ── */}
        <button
          type="button"
          onClick={() => toggleSection('learn')}
          aria-expanded={openSection === 'learn'}
          className={`mt-2 ${headerClass(openSection === 'learn')}`}
        >
          <span>📖</span>
          <span className="flex-1">배우기</span>
          <span className="text-xs text-cosmos-muted">{openSection === 'learn' ? '▾' : '▸'}</span>
        </button>
        {openSection === 'learn' && (
          <div className="ml-2 flex flex-col gap-1 border-l border-cosmos-border pl-2">
            {learnPhases.map((phase) => (
              <NavLink
                key={phase.path}
                to={phase.path}
                end
                onClick={closeNav}
                className={linkClass}
              >
                <span>{phase.emoji}</span>
                <span>{phase.title}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* ── 사냥하기 (진짜 도구) ── */}
        <button
          type="button"
          onClick={() => toggleSection('hunt')}
          aria-expanded={openSection === 'hunt'}
          className={`mt-1 ${headerClass(openSection === 'hunt')}`}
        >
          <span>🛰️</span>
          <span className="flex-1">사냥하기</span>
          <span className="text-xs text-cosmos-muted">{openSection === 'hunt' ? '▾' : '▸'}</span>
        </button>
        {openSection === 'hunt' && (
          <div className="ml-2 flex flex-col gap-1 border-l border-cosmos-nebula/40 pl-2">
            {huntItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeNav}
                className={linkClass}
              >
                <span>{item.emoji}</span>
                <span className="flex flex-col leading-tight">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-cosmos-muted">{item.hint}</span>
                </span>
              </NavLink>
            ))}
          </div>
        )}
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
