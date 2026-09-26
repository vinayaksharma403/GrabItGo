import React, { Component } from 'react'
import { FiRefreshCw, FiHome, FiAlertTriangle } from 'react-icons/fi'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Safely log error in non-production environments or monitoring pipelines
    if (import.meta.env.DEV) {
      console.error('[GrabItGo ErrorBoundary] Uncaught error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-[70vh] flex items-center justify-center px-4 py-12 bg-surface-50'>
          <div className='max-w-md w-full text-center bg-white rounded-card p-6 sm:p-8 shadow-card border border-surface-border animate-fadeIn'>
            {/* Alert Icon */}
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-100 mb-5'>
              <FiAlertTriangle size={32} />
            </div>

            <h2 className='text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2'>
              Something Went Wrong
            </h2>

            <p className='text-xs sm:text-sm text-slate-600 leading-relaxed mb-6'>
              We encountered an unexpected issue while displaying this page. Your account and cart data remain safe.
            </p>

            {/* Recovery Actions */}
            <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
              <button
                type='button'
                onClick={this.handleReload}
                className='btn-primary w-full sm:w-auto text-xs sm:text-sm font-semibold px-4 py-2.5 inline-flex items-center justify-center gap-2 shadow-subtle'
              >
                <FiRefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <button
                type='button'
                onClick={this.handleGoHome}
                className='btn-secondary w-full sm:w-auto text-xs sm:text-sm font-semibold px-4 py-2.5 inline-flex items-center justify-center gap-2'
              >
                <FiHome size={15} />
                <span>Return Home</span>
              </button>
            </div>

            <div className='mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400'>
              If this issue persists, please try refreshing your browser or contact customer support.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
