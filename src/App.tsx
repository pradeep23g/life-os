import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'

import AuthPage from './features/auth/AuthPage'
import MindOsDashboard from './features/mind-os/dashboard/MindOsDashboard'
import HabitsPage from './features/mind-os/habits/HabitsPage'
import JournalPage from './features/mind-os/journal/JournalPage'
import MissionControl from './features/mission-control/dashboard/MissionControl'
import ChallengesPage from './features/progress-hub/challenges/ChallengesPage'
import ProgressHubDashboard from './features/progress-hub/dashboard/ProgressHubDashboard'
import MilestonesPage from './features/progress-hub/milestones/MilestonesPage'
import PersonalSkillsPage from './features/progress-hub/personal-skills/PersonalSkillsPage'
import ProgrammingProgressPage from './features/progress-hub/programming/ProgrammingProgressPage'
import ProductivityHubDashboard from './features/productivity-hub/dashboard/ProductivityHubDashboard'
import PlanningPage from './features/productivity-hub/planning/PlanningPage'
import TasksPage from './features/productivity-hub/tasks/TasksPage'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Sidebar from './layout/Sidebar'

function LocalNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '.'}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm transition-colors ${
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

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:grid md:grid-cols-[240px_1fr]">
      <Sidebar />
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}

function MindOsLayout() {
  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-2xl font-semibold">Mind OS</h1>
        <nav className="mt-3 flex flex-wrap gap-2">
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
        <h1 className="text-2xl font-semibold">Productivity Hub</h1>
        <nav className="mt-3 flex flex-wrap gap-2">
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
        <h1 className="text-2xl font-semibold">Progress Hub</h1>
        <nav className="mt-3 flex flex-wrap gap-2">
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
