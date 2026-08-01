import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import AppErrorBoundary from './components/AppErrorBoundary'
import CommandPalette from './components/CommandPalette'
import Sidebar from './layout/Sidebar'
import { LocalNavLink, ModuleHeader } from './layout/ModuleHeader'
import { getShellTitle } from './layout/shellTitle'
import { AuthProvider, useAuth } from './lib/AuthContext'
import GlobalTimerBar from './features/time-os/components/GlobalTimerBar'
import SystemFeedbackToast from './features/system/components/SystemFeedbackToast'

// Route-level code splitting via React.lazy
const AuthPage = lazy(() => import('./features/auth/AuthPage'))
const MissionControl = lazy(() => import('./features/mission-control/dashboard/MissionControl'))
const MindOsDashboard = lazy(() => import('./features/mind-os/dashboard/MindOsDashboard'))
const HabitsPage = lazy(() => import('./features/mind-os/habits/HabitsPage'))
const JournalPage = lazy(() => import('./features/mind-os/journal/JournalPage'))
const FitnessOsDashboard = lazy(() => import('./features/fitness-os/pages/Dashboard'))
const FitnessLibraryPage = lazy(() => import('./features/fitness-os/pages/Library'))
const PersonalRecordsPage = lazy(() => import('./features/fitness-os/library/PersonalRecordsPage'))
const WorkoutsPage = lazy(() => import('./features/fitness-os/workouts/WorkoutsPage'))
const FinanceDashboard = lazy(() => import('./features/finance-os/pages/FinanceDashboard'))
const DataLabPage = lazy(() => import('./features/data-lab/pages/DataLabPage'))
const ProductivityHubDashboard = lazy(() => import('./features/productivity-hub/dashboard/ProductivityHubDashboard'))
const PlanningPage = lazy(() => import('./features/productivity-hub/planning/PlanningPage'))
const TasksPage = lazy(() => import('./features/productivity-hub/tasks/TasksPage'))
const TimeOSPage = lazy(() => import('./features/time-os/pages/TimeOSPage'))

// Learning OS exports named components from LearningOSLayout
const LearningOSLayoutModule = () => import('./features/learning-os/pages/LearningOSLayout')
const LearningOSLayout = lazy(() => LearningOSLayoutModule().then((m) => ({ default: m.LearningOSLayout })))
const RoadmapDashboard = lazy(() => import('./features/learning-os/pages/RoadmapDashboard').then((m) => ({ default: m.RoadmapDashboard })))
const RoadmapDetailView = lazy(() => import('./features/learning-os/pages/RoadmapDetailView').then((m) => ({ default: m.RoadmapDetailView })))
const ExplorePage = lazy(() => import('./features/learning-os/pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const AnalyticsPage = lazy(() => import('./features/learning-os/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))

function PageLoadingFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-surface p-8 text-slate-400">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        <span className="text-sm font-medium">Loading view...</span>
      </div>
    </div>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="mx-auto mt-20 max-w-md rounded-xl border border-border bg-surface p-6 text-slate-200">
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
    <div className="min-h-screen bg-black text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-black transition-[width] duration-300 motion-reduce:transition-none md:block ${
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
        <header className="sticky top-0 z-20 border-b border-border bg-black/90 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 md:px-6">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-slate-200 hover:bg-[#111111] md:hidden"
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
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
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
      <ModuleHeader title="Mind OS">
        <LocalNavLink to="." label="Dashboard" />
        <LocalNavLink to="habits" label="Habits" />
        <LocalNavLink to="journal" label="Journal" />
      </ModuleHeader>
      <Outlet />
    </section>
  )
}

function ProductivityHubLayout() {
  return (
    <section className="space-y-4">
      <ModuleHeader title="Productivity Hub">
        <LocalNavLink to="." label="Dashboard" />
        <LocalNavLink to="tasks" label="Tasks" />
        <LocalNavLink to="planning" label="Planning" />
      </ModuleHeader>
      <Outlet />
    </section>
  )
}

function FitnessOsLayout() {
  return (
    <section className="space-y-4">
      <ModuleHeader title="Fitness OS">
        <LocalNavLink to="." label="Dashboard" />
        <LocalNavLink to="workouts" label="Workouts" />
        <LocalNavLink to="library" label="Library" />
        <LocalNavLink to="pr" label="Personal Records" />
      </ModuleHeader>
      <Outlet />
    </section>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
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

                <Route path="learning-os" element={<LearningOSLayout />}>
                  <Route index element={<RoadmapDashboard />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="roadmap/:id" element={<RoadmapDetailView />} />
                </Route>

                <Route path="fitness-os" element={<FitnessOsLayout />}>
                  <Route index element={<FitnessOsDashboard />} />
                  <Route path="workouts" element={<WorkoutsPage />} />
                  <Route path="library" element={<FitnessLibraryPage />} />
                  <Route path="pr" element={<PersonalRecordsPage />} />
                </Route>

                <Route path="time-os" element={<TimeOSPage />} />
                <Route path="finance-os" element={<FinanceDashboard />} />
                <Route path="data-lab" element={<DataLabPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

