import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/mission-control', label: 'Mission Control' },
  { to: '/mind-os', label: 'Mind OS' },
  { to: '/productivity-hub', label: 'Productivity Hub' },
  { to: '/progress-hub', label: 'Progress Hub' },
]

function Sidebar() {
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Sidebar] Sign out failed', error)
    }

    setIsSigningOut(false)
  }

  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex min-h-[260px] flex-col">
        <p className="mb-3 text-xs text-slate-400">{user?.email ?? 'Not signed in'}</p>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-2 py-1 text-sm ${
                  isActive ? 'bg-slate-700 text-slate-100' : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-auto rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
        >
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
