import { NavLink, Outlet } from 'react-router-dom'
import { PHASES } from '../../constants/phases'

// Phase 0, 1은 둘 다 path='/' 이므로 네비에서는 1개만 (Home)
const navPhases = PHASES.filter((p, i, arr) =>
  arr.findIndex((x) => x.path === p.path) === i
)

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-cosmos-bg text-cosmos-text font-sans">
      {/* 사이드 네비게이션 */}
      <nav className="w-48 min-h-screen flex flex-col gap-1 p-4 border-r border-cosmos-border bg-cosmos-surface">
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
            end={phase.path === '/'}
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
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
