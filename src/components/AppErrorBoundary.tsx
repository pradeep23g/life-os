import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  message: string | null
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: null,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      message: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] caught runtime error', error, errorInfo)
    this.setState({
      message: error?.message || 'Unknown runtime error',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-base font-semibold text-slate-100">Something went wrong in this workspace.</h2>
          <p className="mt-1 text-sm text-slate-300">
            Try refreshing this page. If the issue continues, check your latest migration status.
          </p>
          {this.state.message ? (
            <p className="mt-2 rounded-lg border border-border bg-black p-2 text-xs text-red-400">
              Runtime error: {this.state.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg border border-border px-4 py-2 text-sm text-slate-300 hover:bg-[#111111]"
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
