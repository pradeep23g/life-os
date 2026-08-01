import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sparkles, Route, GraduationCap, LayoutDashboard } from 'lucide-react'

export function LearningOSLayout() {
  const location = useLocation()
  
  const navItems = [
    { name: 'Roadmaps', path: '/learning-os', icon: <LayoutDashboard size={18} /> },
    { name: 'Explore', path: '/learning-os/explore', icon: <Route size={18} /> },
    { name: 'Analytics', path: '/learning-os/analytics', icon: <Sparkles size={18} /> },
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a1a4a]">
          <GraduationCap className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Learning OS</h1>
          <p className="text-sm text-slate-400">Structured mastery & knowledge</p>
        </div>
      </header>
      
      <nav className="flex gap-6 border-b border-border bg-surface px-6 pt-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              (location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/learning-os'))
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto bg-black p-6">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
