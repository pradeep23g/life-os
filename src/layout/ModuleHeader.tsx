import React from 'react'
import { NavLink } from 'react-router-dom'

export function LocalNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '.'}
      className={({ isActive }) =>
        `shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive ? 'bg-[#222222] text-slate-100' : 'text-slate-300 hover:bg-[#111111]'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function ModuleHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="rounded-xl border border-border bg-surface p-4">
      <h1 className="text-base font-semibold sm:text-2xl">{title}</h1>
      {children ? <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">{children}</nav> : null}
    </header>
  )
}
