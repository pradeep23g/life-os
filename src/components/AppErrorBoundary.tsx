import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] caught runtime error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Something went wrong in this workspace.</h2>
          <p className="mt-1 text-sm text-slate-300">
            Try refreshing this page. If the issue continues, check your latest migration status.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700"
          >
            Reload Workspace
          </button>
        </section>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
