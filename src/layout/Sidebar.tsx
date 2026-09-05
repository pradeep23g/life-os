import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type IconProps = {
  className?: string
}

type SidebarProps = {
  compact?: boolean
  onNavigate?: () => void
  onToggleDesktopExpanded?: () => void
  desktopExpanded?: boolean
}

function MissionControlIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 5h16v14H4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10h2v5H9zm4-3h2v8h-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MindOsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3v18M3 12h18" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}

function ProductivityIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 6h16v12H4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  )
}

function FitnessIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 9v6M18 9v6" strokeLinecap="round" />
      <path d="M9 8v8M15 8v8" strokeLinecap="round" />
      <path d="M4 11h2M18 11h2M4 13h2M18 13h2" strokeLinecap="round" />
      <path d="M9 12h6" strokeLinecap="round" />
    </svg>
  )
}

function TimeOsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FinanceIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10.5c0-.9.9-1.5 2-1.5h2c1.1 0 2 .6 2 1.5s-.9 1.5-2 1.5h-2c-1.1 0-2 .6-2 1.5S9.9 15 11 15h2c1.1 0 2-.6 2-1.5" strokeLinecap="round" />
      <path d="M12 7v10" strokeLinecap="round" />
    </svg>
  )
}

function DataLabIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M9 4h6" strokeLinecap="round" />
      <path d="M10 4v5l-4 7a3 3 0 002.6 4.5h6.8A3 3 0 0018 16l-4-7V4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14h6" strokeLinecap="round" />
    </svg>
  )
}

function SignOutIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12H9" strokeLinecap="round" />
      <path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RailToggleIcon({ className = 'h-5 w-5', expanded }: IconProps & { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M7 5h10M7 12h10M7 19h10" strokeLinecap="round" />
      {expanded ? (
        <path d="M5 8l-2 4 2 4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M3 8l2 4-2 4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

const navItems = [
  { to: '/mission-control', label: 'Mission Control', Icon: MissionControlIcon },
  { to: '/mind-os', label: 'Mind OS', Icon: MindOsIcon },
  { to: '/productivity-hub', label: 'Productivity Hub', Icon: ProductivityIcon },
  { to: '/time-os', label: 'Time OS', Icon: TimeOsIcon },
  { to: '/finance-os', label: 'Finance OS', Icon: FinanceIcon },
  { to: '/data-lab', label: 'Data Lab', Icon: DataLabIcon },
  { to: '/fitness-os', label: 'Fitness OS', Icon: FitnessIcon },
  { to: '/learning-os', label: 'Learning OS', Icon: GraduationCap },
] as const

function Sidebar({ compact = false, onNavigate, onToggleDesktopExpanded, desktopExpanded = false }: SidebarProps) {
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const showDesktopToggle = Boolean(onToggleDesktopExpanded)

  const handleSignOut = async () => {
    setIsSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Sidebar] Sign out failed', error)
    }

    setIsSigningOut(false)
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside className="h-full rounded-xl border border-border bg-surface p-2">
      <div className={`flex h-full min-h-[260px] flex-col ${compact ? 'items-center' : ''}`}>
        {showDesktopToggle ? (
          <button
            type="button"
            onClick={onToggleDesktopExpanded}
            title={compact ? (desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar') : undefined}
            aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`mb-2 flex items-center rounded-lg border border-border bg-[#111111] text-slate-100 transition-colors hover:bg-[#222222] ${
              compact ? 'h-10 w-10 justify-center px-0' : 'w-full gap-2 px-3 py-2 text-sm'
            }`}
          >
            <RailToggleIcon className="h-5 w-5 shrink-0" expanded={desktopExpanded} />
            {!compact ? <span>{desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}</span> : null}
          </button>
        ) : null}

        {!compact ? <p className="mb-3 truncate px-2 text-xs text-slate-400">{user?.email ?? 'Not signed in'}</p> : null}

        <nav className={`flex w-full flex-col gap-2 ${compact ? 'items-center' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={compact ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                  compact ? 'w-10 justify-center px-0' : 'w-full'
                } ${isActive ? 'bg-[#222222] text-slate-100' : 'text-slate-200 hover:bg-[#111111] hover:text-white'}`
              }
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              {!compact ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          title={compact ? user?.email ?? 'Profile' : undefined}
          aria-label="Profile"
          className={`mt-auto flex items-center rounded-lg border border-border bg-[#111111] text-sm text-slate-100 transition-colors hover:bg-[#222222] ${
            compact ? 'h-10 w-10 justify-center px-0' : 'w-full gap-2 px-3 py-2'
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-[#222222] text-xs font-semibold">
            {userInitial}
          </span>
          {!compact ? <span className="truncate">Profile</span> : null}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title={compact ? 'Sign Out' : undefined}
          aria-label="Sign Out"
          className={`mt-2 flex items-center rounded-lg border border-border bg-[#111111] text-sm text-slate-100 transition-colors hover:bg-[#222222] disabled:opacity-60 ${
            compact ? 'h-10 w-10 justify-center px-0' : 'w-full gap-2 px-3 py-2'
          }`}
        >
          <SignOutIcon className="h-5 w-5" />
          {!compact ? <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span> : null}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
