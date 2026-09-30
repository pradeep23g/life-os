import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut, ArrowUpRight, AlertCircle, Settings } from 'lucide-react'
import { useAuth } from '../../../lib/AuthContext'

export function ProfileSystemOperations() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Failed to terminate session:', err)
      setIsSigningOut(false)
    }
  }

  return (
    <section className="space-y-6 pt-4 border-t border-border/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
            Room 05 · System Operations
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary mt-1">
            Administration & Session Governance
          </h2>
        </div>
        <p className="font-mono text-xs text-text-tertiary">
          SYS-OP // SECURE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admin Navigation Console Card */}
        <div className="group relative rounded-xl border border-border bg-surface/60 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:bg-surface/90 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-primary">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Root Authority
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                System Administration
              </h3>
              <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                Calibrate global telemetry pipelines, inspect event queues, trigger schema syncs, and adjust system threshold parameters.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-xs font-mono font-medium text-text-primary transition-all duration-200 hover:border-primary hover:bg-elevated group/btn"
            >
              <span>Launch Admin Console</span>
              <ArrowUpRight className="h-4 w-4 text-text-tertiary transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:text-primary" />
            </button>
          </div>
        </div>

        {/* Session Termination Card */}
        <div className="group relative rounded-xl border border-border bg-surface/60 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 hover:border-threat-warning/40 hover:bg-surface/90 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-threat-warning">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono border border-border bg-surface text-text-secondary truncate max-w-[180px]">
                {user?.email || 'Active Operator'}
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Session Control
              </h3>
              <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                Invalidate cryptographic session tokens, flush volatile state caches, and disconnect this device from telemetry streaming.
              </p>
            </div>
          </div>

          <div className="pt-6">
            {confirmLogout ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-threat-warning text-black font-mono text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSigningOut ? 'Terminating...' : 'Confirm Sign Out'}
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  disabled={isSigningOut}
                  className="px-3 py-2.5 rounded-lg border border-border bg-surface font-mono text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLogout(true)}
                className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-lg border border-threat-warning/30 bg-threat-warning/5 text-xs font-mono font-medium text-threat-warning transition-all duration-200 hover:bg-threat-warning/10 hover:border-threat-warning/50"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Terminate Active Session
                </span>
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
