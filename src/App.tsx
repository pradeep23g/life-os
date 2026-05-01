import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import AuthPage from './features/auth/AuthPage'
import MindOsDashboard from './features/mind-os/dashboard/MindOsDashboard'
import HabitsPage from './features/mind-os/habits/HabitsPage'
import JournalPage from './features/mind-os/journal/JournalPage'
import FitnessOsDashboard from './features/fitness-os/pages/Dashboard'
import FitnessLibraryPage from './features/fitness-os/pages/Library'
import WorkoutsPage from './features/fitness-os/workouts/WorkoutsPage'
import FinanceDashboard from './features/finance-os/pages/FinanceDashboard'
import MissionControl from './features/mission-control/dashboard/MissionControl'
import ChallengesPage from './features/progress-hub/challenges/ChallengesPage'
import ProgressHubDashboard from './features/progress-hub/dashboard/ProgressHubDashboard'
import MilestonesPage from './features/progress-hub/milestones/MilestonesPage'
import PersonalSkillsPage from './features/progress-hub/personal-skills/PersonalSkillsPage'
import ProgrammingProgressPage from './features/progress-hub/programming/ProgrammingProgressPage'
import ProductivityHubDashboard from './features/productivity-hub/dashboard/ProductivityHubDashboard'
import PlanningPage from './features/productivity-hub/planning/PlanningPage'
import TasksPage from './features/productivity-hub/tasks/TasksPage'
import SystemFeedbackToast from './features/system/components/SystemFeedbackToast'
import TimeOSPage from './features/time-os/pages/TimeOSPage'
import GlobalTimerBar from './features/time-os/components/GlobalTimerBar'
import AppErrorBoundary from './components/AppErrorBoundary'
import CommandPalette from './components/CommandPalette'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Sidebar from './layout/Sidebar'

function getShellTitle(pathname: string) {
  if (pathname === '/' || pathname === '/mission-control') {
    return 'Mission Control'
  }

  if (pathname === '/mind-os') {
    return 'Mind OS'
  }

  if (pathname.startsWith('/mind-os/habits')) {
    return 'Mind OS - Habits'
  }

  if (pathname.startsWith('/mind-os/journal')) {
    return 'Mind OS - Journal'
  }

  if (pathname === '/productivity-hub') {
    return 'Productivity Hub'
  }

  if (pathname.startsWith('/productivity-hub/tasks')) {
    return 'Productivity Hub - Tasks'
  }

  if (pathname.startsWith('/productivity-hub/planning')) {
    return 'Productivity Hub - Planning'
  }

  if (pathname === '/progress-hub') {
    return 'Progress Hub'
  }

  if (pathname.startsWith('/progress-hub/programming')) {
    return 'Progress Hub - Programming'
  }

  if (pathname.startsWith('/progress-hub/personal-skills')) {
    return 'Progress Hub - Personal Skills'
  }

  if (pathname.startsWith('/progress-hub/milestones')) {
    return 'Progress Hub - Milestones'
  }

  if (pathname.startsWith('/progress-hub/challenges')) {
    return 'Progress Hub - Challenges'
  }

  if (pathname === '/fitness-os') {
    return 'Fitness OS'
  }

  if (pathname.startsWith('/fitness-os/workouts')) {
    return 'Fitness OS - Workouts'
  }

  if (pathname.startsWith('/fitness-os/library')) {
    return 'Fitness OS - Library'
  }

  if (pathname.startsWith('/time-os')) {
    return 'Time OS'
  }

  if (pathname.startsWith('/finance-os')) {
    return 'Finance OS'
  }

  return 'Life OS'
}

function LocalNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '.'}
      className={({ isActive }) =>
        `shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive ? 'bg-slate-700 text-slate-100' : 'text-slate-300 hover:bg-slate-800'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="mx-auto mt-20 max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-200">
        Checking authentication...
      </section>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

function MenuIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

function AppShell() {
  const location = useLocation()
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null)
  const [desktopExpanded, setDesktopExpanded] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.sessionStorage.getItem('life-os.desktop-sidebar') === 'expanded'
  })

  const shellTitle = useMemo(() => getShellTitle(location.pathname), [location.pathname])
  const mobileOpen = mobileOpenPath === location.pathname

  const closeMobileSidebar = () => {
    setMobileOpenPath(null)
  }

  const toggleMobileSidebar = () => {
    setMobileOpenPath((previous) => (previous === location.pathname ? null : location.pathname))
  }

  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileSidebar()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [mobileOpen])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem('life-os.desktop-sidebar', desktopExpanded ? 'expanded' : 'compact')
  }, [desktopExpanded])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-800 bg-slate-950 transition-[width] duration-300 motion-reduce:transition-none md:block ${
          desktopExpanded ? 'w-72' : 'w-20'
        }`}
      >
        <div className="h-full p-2">
          <Sidebar
            compact={!desktopExpanded}
            desktopExpanded={desktopExpanded}
            onToggleDesktopExpanded={() => setDesktopExpanded((previous) => !previous)}
          />
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding-left] duration-300 motion-reduce:transition-none ${
          desktopExpanded ? 'md:pl-72' : 'md:pl-20'
        }`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 md:px-6">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 md:hidden"
              aria-label="Toggle sidebar"
              aria-expanded={mobileOpen}
            >
              <MenuIcon />
            </button>

            <p className="truncate text-sm font-semibold text-slate-100 sm:text-base">{shellTitle}</p>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6">
          <AppErrorBoundary key={location.pathname}>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>

      <div className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          onClick={closeMobileSidebar}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Close sidebar"
        />

        <aside
          className={`absolute inset-y-0 left-0 w-72 p-2 transition-transform duration-300 motion-reduce:transition-none ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!mobileOpen}
        >
          <Sidebar onNavigate={closeMobileSidebar} />
        </aside>
      </div>

      <GlobalTimerBar />
      <SystemFeedbackToast />
      <CommandPalette />
    </div>
  )
}

function MindOsLayout() {
  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Mind OS</h1>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <LocalNavLink to="." label="Dashboard" />
          <LocalNavLink to="habits" label="Habits" />
          <LocalNavLink to="journal" label="Journal" />
        </nav>
      </header>
      <Outlet />
    </section>
  )
}

function ProductivityHubLayout() {
  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Productivity Hub</h1>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <LocalNavLink to="." label="Dashboard" />
          <LocalNavLink to="tasks" label="Tasks" />
          <LocalNavLink to="planning" label="Planning" />
        </nav>
      </header>
      <Outlet />
    </section>
  )
}

function ProgressHubLayout() {
  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Progress Hub</h1>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <LocalNavLink to="." label="Dashboard" />
          <LocalNavLink to="programming" label="Programming" />
          <LocalNavLink to="personal-skills" label="Personal Skills" />
          <LocalNavLink to="milestones" label="Milestones" />
          <LocalNavLink to="challenges" label="Challenges" />
        </nav>
      </header>
      <Outlet />
    </section>
  )
}

function FitnessOsLayout() {
  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Fitness OS</h1>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <LocalNavLink to="." label="Dashboard" />
          <LocalNavLink to="workouts" label="Workouts" />
          <LocalNavLink to="library" label="Library" />
        </nav>
      </header>
      <Outlet />
    </section>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<MissionControl />} />
              <Route path="mission-control" element={<MissionControl />} />

              <Route path="mind-os" element={<MindOsLayout />}>
                <Route index element={<MindOsDashboard />} />
                <Route path="habits" element={<HabitsPage />} />
                <Route path="journal" element={<JournalPage />} />
              </Route>

              <Route path="productivity-hub" element={<ProductivityHubLayout />}>
                <Route index element={<ProductivityHubDashboard />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="planning" element={<PlanningPage />} />
              </Route>

              <Route path="progress-hub" element={<ProgressHubLayout />}>
                <Route index element={<ProgressHubDashboard />} />
                <Route path="programming" element={<ProgrammingProgressPage />} />
                <Route path="personal-skills" element={<PersonalSkillsPage />} />
                <Route path="milestones" element={<MilestonesPage />} />
                <Route path="challenges" element={<ChallengesPage />} />
              </Route>

              <Route path="fitness-os" element={<FitnessOsLayout />}>
                <Route index element={<FitnessOsDashboard />} />
                <Route path="workouts" element={<WorkoutsPage />} />
                <Route path="library" element={<FitnessLibraryPage />} />
              </Route>

              <Route path="time-os" element={<TimeOSPage />} />
              <Route path="finance-os" element={<FinanceDashboard />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
