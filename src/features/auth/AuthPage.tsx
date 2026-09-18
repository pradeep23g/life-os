import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import { LifeOsLogo } from '../../components/icons'

function AuthPage() {
 const { user, loading } = useAuth()

 const [mode, setMode] = useState<'login' | 'signup'>('login')
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [statusMessage, setStatusMessage] = useState<string | null>(null)
 const [errorMessage, setErrorMessage] = useState<string | null>(null)
 const [isSubmitting, setIsSubmitting] = useState(false)

 if (loading) {
 return <section className="mx-auto mt-20 max-w-md rounded-xl border border-border bg-surface p-6">Checking session...</section>
 }

 if (user) {
 return <Navigate to="/" replace />
 }

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault()

 setErrorMessage(null)
 setStatusMessage(null)
 setIsSubmitting(true)

 if (mode === 'login') {
 const { error } = await supabase.auth.signInWithPassword({ email, password })

 if (error) {
 setErrorMessage(error.message)
 } else {
 setStatusMessage('Signed in successfully.')
 }
 } else {
 const { data, error } = await supabase.auth.signUp({ email, password })

 if (error) {
 setErrorMessage(error.message)
 } else if (data.session) {
 setStatusMessage('Account created and signed in.')
 } else {
 setStatusMessage('Account created. Check your email to confirm your account.')
 }
 }

 setIsSubmitting(false)
 }

 return (
 <section className="mx-auto mt-20 max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8">
 <div className="flex items-center gap-3 mb-5">
 <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-elevated border border-border/80 text-text-primary shadow-sm">
 <LifeOsLogo className="h-6 w-6" />
 </div>
 <div>
 <h1 className="text-xl font-serif font-medium text-text-primary tracking-tight">Life OS</h1>
 <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Winter Arc 2026</p>
 </div>
 </div>
 <p className="text-sm text-text-secondary">Sign in to resume your active campaign and telemetry ledger.</p>

 <div className="mt-6 grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => setMode('login')}
 className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
 mode === 'login' ? 'border-accent-primary bg-elevated text-text-primary' : 'border-border bg-surface text-text-secondary'
 }`}
 >
 Login
 </button>
 <button
 type="button"
 onClick={() => setMode('signup')}
 className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
 mode === 'signup' ? 'border-accent-primary bg-elevated text-text-primary' : 'border-border bg-surface text-text-secondary'
 }`}
 >
 Sign Up
 </button>
 </div>

 <form onSubmit={handleSubmit} className="mt-4 space-y-4">
 <label className="block text-sm text-text-secondary">
 Email
 <input
 type="email"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 required
 className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-text-primary"
 />
 </label>

 <label className="block text-sm text-text-secondary">
 Password
 <input
 type="password"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 required
 minLength={6}
 className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-text-primary"
 />
 </label>

 {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
 {statusMessage ? <p className="text-sm text-emerald-400">{statusMessage}</p> : null}

 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-primary hover:bg-elevated disabled:opacity-60"
 >
 {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
 </button>
 </form>
 </section>
 )
}

export default AuthPage
