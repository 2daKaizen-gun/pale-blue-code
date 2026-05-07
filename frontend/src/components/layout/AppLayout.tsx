import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { path: '/',           label: '🏠 Home' },
  { path: '/solar',      label: '🪐 Solar System' },
  { path: '/gravity',    label: '⚛️ Gravity' },
  { path: '/blackhole',  label: '🕳️ Blackhole' },
  { path: '/exoplanet',  label: '🔭 Exoplanet' },
  { path: '/data',       label: '📉 Data' },
  { path: '/signal',     label: '📡 Signal' },
  { path: '/hunt',       label: '🎯 Hunt' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      {/* 사이드 네비게이션 */}
      <nav className="w-48 min-h-screen flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {item.label}
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
