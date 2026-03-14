import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'

function AuthPage() {
  const { user, loading } = useAuth()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) {
    return <section className="mx-auto mt-20 max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6">Checking session...</section>
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
    <section className="mx-auto mt-20 max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="text-2xl font-semibold text-slate-100">Life OS Auth</h1>
      <p className="mt-1 text-sm text-slate-400">Sign in or create an account to access Mind OS and Productivity Hub.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-md border px-3 py-2 text-sm ${
            mode === 'login' ? 'border-slate-400 bg-slate-700 text-slate-100' : 'border-slate-600 bg-slate-800 text-slate-300'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-md border px-3 py-2 text-sm ${
            mode === 'signup' ? 'border-slate-400 bg-slate-700 text-slate-100' : 'border-slate-600 bg-slate-800 text-slate-300'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block text-sm text-slate-300">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-slate-100"
          />
        </label>

        <label className="block text-sm text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-slate-100"
          />
        </label>

        {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
        {statusMessage ? <p className="text-sm text-emerald-400">{statusMessage}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>
    </section>
  )
}

export default AuthPage
