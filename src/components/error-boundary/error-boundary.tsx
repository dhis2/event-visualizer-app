import { Component, type PropsWithChildren } from 'react'

type ErrorBoundaryProps = PropsWithChildren<{
    onError: (error: Error) => void
}>

type ErrorBoundaryState = {
    hasError: boolean
}

export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { hasError: false }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error) {
        this.props.onError(error)
    }

    render() {
        if (this.state.hasError) {
            return null
        }
        return this.props.children
    }
}
