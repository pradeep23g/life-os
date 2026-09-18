import React from 'react'
import { NavLink } from 'react-router-dom'

export function LocalNavLink({ to, label }: { to: string; label: string }) {
 return (
 <NavLink
 to={to}
 end={to === '.'}
 className={({ isActive }) =>
 `shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${
 isActive ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:bg-surface'
 }`
 }
 >
 {label}
 </NavLink>
 )
}

export function ModuleHeader({
  children,
}: {
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
  children?: React.ReactNode
}) {
  if (!children) return null

  return (
    <nav
      className="flex items-center gap-2 border-b border-border-subtle pb-3 mb-6 overflow-x-auto"
      aria-label="Submodule navigation"
    >
      {children}
    </nav>
  )
}
