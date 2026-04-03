import { Component, ReactNode } from 'react'
import StatusScreen from './StatusScreen'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Something went wrong while rendering the app.',
    }
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled application error:', error)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReturnToLogin = () => {
    window.location.assign('/login')
  }

  render() {
    if (this.state.hasError) {
      return (
        <StatusScreen
          title="Something went wrong"
          message={this.state.errorMessage}
          primaryActionLabel="Reload App"
          onPrimaryAction={this.handleReload}
          secondaryActionLabel="Go to Login"
          onSecondaryAction={this.handleReturnToLogin}
        />
      )
    }

    return this.props.children
  }
}
