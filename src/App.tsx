import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, NavLink } from 'react-router-dom'

import AppErrorBoundary from './components/AppErrorBoundary'
import CommandPalette from './components/CommandPalette'
import { AstrolabeOrbNav } from './layout/AstrolabeOrbNav'
import { LocalNavLink, ModuleHeader } from './layout/ModuleHeader'
import { getShellTitle } from './layout/shellTitle'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { LifeOsLogo, MindOsIcon, ProductivityIcon, FitnessIcon } from './components/icons'
import { LoadingView } from './components/LoadingView'
import { useEnvironmentSystem } from './lib/useEnvironmentSystem'
import GlobalTimerBar from './features/time-os/components/GlobalTimerBar'
import SystemFeedbackToast from './features/system/components/SystemFeedbackToast'

// Route-level code splitting via React.lazy
const AuthPage = lazy(() => import('./features/auth/AuthPage'))
const MissionControl = lazy(() => import('./features/mission-control/dashboard/MissionControl'))
const MindOsDashboard = lazy(() => import('./features/mind-os/dashboard/MindOsDashboard'))
const HabitsPage = lazy(() => import('./features/mind-os/habits/HabitsPage'))
const JournalPage = lazy(() => import('./features/mind-os/journal/JournalPage'))
const FitnessLibraryPage = lazy(() => import('./features/fitness-os/library/FitnessLibraryPage'))
const PersonalRecordsPage = lazy(() => import('./features/fitness-os/library/PersonalRecordsPage'))
const WorkoutsPage = lazy(() => import('./features/fitness-os/workouts/WorkoutsPage'))
const FinanceDashboard = lazy(() => import('./features/finance-os/pages/FinanceDashboard'))
const DataLabPage = lazy(() => import('./features/data-lab/pages/DataLabPage'))
const FieldReportPage = lazy(() => import('./features/reports/FieldReportPage'))
const ProductivityHubDashboard = lazy(() => import('./features/productivity-hub/dashboard/ProductivityHubDashboard'))
const PlanningPage = lazy(() => import('./features/productivity-hub/planning/PlanningPage'))
const TasksPage = lazy(() => import('./features/productivity-hub/tasks/TasksPage'))
const TimeOSPage = lazy(() => import('./features/time-os/pages/TimeOSPage'))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'))
const ArcPage = lazy(() => import('./features/arc/pages/ArcPage'))
import HomePage from './features/home/HomePage'

// Learning OS exports named components from LearningOSLayout
const LearningOSLayoutModule = () => import('./features/learning-os/pages/LearningOSLayout')
const LearningOSLayout = lazy(() => LearningOSLayoutModule().then((m) => ({ default: m.LearningOSLayout })))
const RoadmapDashboard = lazy(() => import('./features/learning-os/pages/RoadmapDashboard'))
const RoadmapDetailView = lazy(() => import('./features/learning-os/pages/RoadmapDetailView').then((m) => ({ default: m.RoadmapDetailView })))
const ExplorePage = lazy(() => import('./features/learning-os/pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const AnalyticsPage = lazy(() => import('./features/learning-os/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const AdminConsolePage = lazy(() => import('./features/admin/pages/AdminConsolePage'))

function PageLoadingFallback() {
  return (
    <LoadingView
      variant="page"
      label="Calibrating Horizon"
      sublabel="Synchronizing domain telemetry..."
    />
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <LoadingView
        variant="fullscreen"
        label="Authenticating Presence"
        sublabel="Verifying cryptographic session token..."
      />
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

function AppShell() {
 useEnvironmentSystem()

 const location = useLocation()
 const shellTitle = useMemo(() => getShellTitle(location.pathname), [location.pathname])

 return (
 <div className="min-h-screen flex flex-col bg-background text-text-primary relative">
 <header className="sticky top-0 z-20 bg-background/80 backdrop-blur md:hidden">
 <div className="flex h-14 items-center gap-2 px-3 md:px-6">
 <div className="flex items-center justify-center w-7 h-7 rounded-md bg-surface border border-border/80 text-text-primary shrink-0">
 <LifeOsLogo className="h-4 w-4" />
 </div>
 <p className="truncate text-sm font-serif font-medium text-text-primary sm:text-base">{shellTitle}</p>
 </div>
 </header>

 <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
 <AppErrorBoundary key={location.pathname}>
 <Suspense fallback={<PageLoadingFallback />}>
 <Outlet />
 </Suspense>
 </AppErrorBoundary>
 </main>

 <AstrolabeOrbNav />
 <GlobalTimerBar />
 <SystemFeedbackToast />
 <CommandPalette />
 </div>
 )
}

function MindOsLayout() {
  return (
  <section className="space-y-4">
  <ModuleHeader title="Mind OS" icon={MindOsIcon}>
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
  <ModuleHeader title="Productivity Hub" icon={ProductivityIcon}>
  <LocalNavLink to="." label="Dashboard" />
  <LocalNavLink to="tasks" label="Tasks" />
  <LocalNavLink to="planning" label="Planning" />
  </ModuleHeader>
  <Outlet />
  </section>
  )
}

function FitnessOsLayout() {
  const location = useLocation()
  
  return (
    <section className="min-h-[85vh] flex flex-col font-sans selection:bg-threat-critical/30">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pt-8 md:pt-12 px-6 gap-4 border-b border-border-subtle pb-6 mb-4">
        <div className="flex items-center gap-3 text-text-primary">
          <FitnessIcon className="h-5 w-5 text-threat-critical" />
          <h1 className="text-sm uppercase tracking-[0.2em] font-medium">Kinetic Ledger</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-surface border border-border-subtle rounded-full p-1">
            <NavLink 
              to="workouts" 
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${isActive || location.pathname === '/fitness-os' ? 'bg-threat-critical text-background shadow font-bold' : 'text-text-tertiary hover:text-text-primary'}`} 
            >
              Workouts
            </NavLink>
            <NavLink 
              to="library" 
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-threat-critical text-background shadow font-bold' : 'text-text-tertiary hover:text-text-primary'}`} 
            >
              Library
            </NavLink>
            <NavLink 
              to="pr" 
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-threat-critical text-background shadow font-bold' : 'text-text-tertiary hover:text-text-primary'}`} 
            >
              PRs
            </NavLink>
          </div>
        </div>
      </header>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </div>
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
 <Route index element={<HomePage />} />
 <Route path="arc" element={<ArcPage />} />
 <Route path="system" element={<MissionControl />} />
 <Route path="mission-control" element={<Navigate to="/system" replace />} />
 <Route path="profile" element={<ProfilePage />} />
 <Route path="admin" element={<AdminConsolePage />} />

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
    <Route index element={<Navigate to="workouts" replace />} />
    <Route path="workouts" element={<WorkoutsPage />} />
    <Route path="library" element={<FitnessLibraryPage />} />
    <Route path="pr" element={<PersonalRecordsPage />} />
  </Route>

 <Route path="time-os" element={<TimeOSPage />} />
 <Route path="finance-os" element={<FinanceDashboard />} />
 <Route path="data-lab" element={<DataLabPage />} />
 <Route path="reports" element={<FieldReportPage />} />

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


