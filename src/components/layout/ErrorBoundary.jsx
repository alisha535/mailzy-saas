import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[Mailzy] Component crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold text-lg mb-1">Something went wrong</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              This section crashed unexpectedly. Your data is safe.
            </p>
            {this.state.error?.message && (
              <code className="mt-3 block text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 max-w-sm text-left">
                {this.state.error.message}
              </code>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Hook-based wrapper for convenience ───────────────────────
export function withErrorBoundary(Component) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
