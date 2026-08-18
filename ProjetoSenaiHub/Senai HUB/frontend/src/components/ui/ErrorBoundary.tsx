import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '../../i18n'
import { OutlineButton } from '../connect/ConnectShared'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[280px] max-w-lg flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center">
          <h2 className="text-lg font-semibold text-hub-navy">
            {this.props.fallbackTitle ?? i18n.t('errors.boundaryTitle')}
          </h2>
          <p className="text-sm text-hub-text-muted">{i18n.t('errors.boundaryBody')}</p>
          <OutlineButton onClick={this.handleRetry}>{i18n.t('common.retry')}</OutlineButton>
        </div>
      )
    }

    return this.props.children
  }
}
