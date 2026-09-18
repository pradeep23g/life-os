import { Outlet, Link, useLocation } from 'react-router-dom'
import { Compass, BookOpen, BarChart2 } from 'lucide-react'
import { useActiveTimer } from '../../time-os'
import { LearningIcon } from '../../../components/icons'

export function LearningOSLayout() {
  const location = useLocation()
  const { data: activeTimer } = useActiveTimer()
  const isLearningTimerActive = activeTimer && activeTimer.bucket === 'Learning'

  const navItems = [
    { name: 'Study Shelf & Atlas', path: '/learning-os', icon: <BookOpen size={15} /> },
    { name: 'Cartography & Tracks', path: '/learning-os/explore', icon: <Compass size={15} /> },
    { name: 'Intellectual Telemetry', path: '/learning-os/analytics', icon: <BarChart2 size={15} /> },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary font-sans antialiased">
      {/* Library Archival Header */}
      <header className="border-b border-border-subtle bg-surface/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-elevated text-accent-primary">
              <LearningIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-medium tracking-tight text-text-primary">
                  The Library
                </h1>
                <span className="text-xs font-mono text-text-tertiary">/</span>
                <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                  Map Room
                </span>
              </div>
              <p className="text-xs font-serif italic text-text-secondary">
                Intellectual Cartography & Deep Study Trajectories
              </p>
            </div>
          </div>

          {/* Ambient Focus Status if active */}
          {isLearningTimerActive && (
            <div className="flex items-center gap-2 rounded border border-accent-primary/50 bg-accent-primary/10 px-3 py-1 text-xs font-mono text-accent-primary self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
              <span>Study Focus Active: {activeTimer.description || 'Session'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Sub-rail */}
      <nav aria-label="Learning OS Navigation" className="border-b border-border-subtle bg-surface/40 px-6">
        <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/learning-os' && location.pathname.startsWith(item.path))

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 border-b-2 py-3 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-accent-primary text-text-primary font-medium'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Primary Room Viewport */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
