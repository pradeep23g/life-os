import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/Avatar'
import { useSystemStatus } from '../features/system/api/useSystemStatus'
import {
  LifeOsLogo,
  HomeIcon,
  SystemIcon,
  WinterArcIcon,
  MindOsIcon,
  ProductivityIcon,
  TimeOsIcon,
  FinanceIcon,
  FitnessIcon,
  LearningIcon,
  DataLabIcon,
  ReportsIcon,
  SignOutIcon,
  RailToggleIcon,
} from '../components/icons'

type SidebarProps = {
  compact?: boolean
  onNavigate?: () => void
  onToggleDesktopExpanded?: () => void
  desktopExpanded?: boolean
}

const navItems = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/system', label: 'System', Icon: SystemIcon },
  { to: '/arc', label: 'Winter Arc', Icon: WinterArcIcon },
  { to: '/mind-os', label: 'Mind OS', Icon: MindOsIcon },
  { to: '/productivity-hub', label: 'Productivity', Icon: ProductivityIcon },
  { to: '/time-os', label: 'Time OS', Icon: TimeOsIcon },
  { to: '/finance-os', label: 'Finance', Icon: FinanceIcon },
  { to: '/data-lab', label: 'Data Lab', Icon: DataLabIcon },
  { to: '/reports', label: 'Reports', Icon: ReportsIcon },
  { to: '/fitness-os', label: 'Fitness', Icon: FitnessIcon },
  { to: '/learning-os', label: 'Learning', Icon: LearningIcon },
] as const

function Sidebar({ compact = false, onNavigate, onToggleDesktopExpanded, desktopExpanded = false }: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: systemStatus } = useSystemStatus()
  const momentumScore = systemStatus?.momentum.momentum ?? 0
  const avatarState: 'recovering' | 'active' | 'idle' =
    momentumScore < 30 ? 'recovering' : momentumScore > 60 ? 'active' : 'idle'
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

  const handleProfileClick = () => {
    if (onNavigate) onNavigate()
    navigate('/profile')
  }

  return (
    <aside className="h-full rounded-xl border border-border bg-surface p-2 flex flex-col justify-between">
      <div className={`flex flex-col ${compact ? 'items-center' : ''}`}>
        {/* Brand Anchor Header */}
        <div className={`w-full flex items-center ${compact ? 'justify-center mb-3' : 'justify-between px-2 mb-4'} pt-1`}>
          <NavLink
            to="/"
            onClick={onNavigate}
            title={compact ? 'Life OS • Winter Arc' : undefined}
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-elevated border border-border/80 text-text-primary group-hover:border-accent-primary/40 transition-colors shadow-sm shrink-0">
              <LifeOsLogo className="h-4 w-4" />
            </div>
            {!compact ? (
              <div className="flex flex-col min-w-0">
                <span className="font-serif font-medium tracking-tight text-text-primary text-sm leading-none">
                  Life OS
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-text-tertiary mt-1">
                  Winter Arc
                </span>
              </div>
            ) : null}
          </NavLink>

          {showDesktopToggle && !compact ? (
            <button
              type="button"
              onClick={onToggleDesktopExpanded}
              title={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              className="flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-text-primary hover:bg-elevated transition-colors"
            >
              <RailToggleIcon className="h-4 w-4" expanded={desktopExpanded} />
            </button>
          ) : null}
        </div>

        {showDesktopToggle && compact ? (
          <button
            type="button"
            onClick={onToggleDesktopExpanded}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="mb-3 flex items-center justify-center h-9 w-9 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-elevated transition-colors"
          >
            <RailToggleIcon className="h-4 w-4" expanded={false} />
          </button>
        ) : null}

        <nav className={`flex w-full flex-col gap-1.5 ${compact ? 'items-center' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={compact ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  compact ? 'w-10 justify-center px-0' : 'w-full'
                } ${isActive ? 'bg-border-subtle text-text-primary' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'}`
              }
            >
              <item.Icon className="h-[18px] w-[18px] shrink-0" />
              {!compact ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className={`flex flex-col gap-2 ${compact ? 'items-center' : ''} pt-4 border-t border-border mt-4`}>
        <button
          type="button"
          onClick={handleProfileClick}
          title={compact ? user?.email ?? 'Profile' : undefined}
          aria-label="Profile"
          className={`flex items-center rounded-lg text-sm text-text-primary transition-colors hover:bg-elevated ${
            compact ? 'h-10 w-10 justify-center px-0' : 'w-full gap-3 px-2 py-1.5'
          }`}
        >
          <Avatar size="sm" state={avatarState} momentumScore={momentumScore} />
          {!compact ? <div className="flex flex-col text-left overflow-hidden">
            <span className="truncate font-medium text-xs">Profile & Stats</span>
          </div> : null}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title={compact ? 'Sign Out' : undefined}
          aria-label="Sign Out"
          className={`flex items-center rounded-lg text-sm text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary disabled:opacity-60 ${
            compact ? 'h-10 w-10 justify-center px-0' : 'w-full gap-3 px-2 py-1.5'
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0">
            <SignOutIcon className="h-4 w-4" />
          </div>
          {!compact ? <span className="font-medium text-xs">{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span> : null}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
