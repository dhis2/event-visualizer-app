import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import { Component, useEffect, useState, type PropsWithChildren } from 'react'
import classes from './styles/uncaught-error-boundary.module.css'

type UncaughtErrorBoundaryState = {
    error: Error | null
}

class UncaughtErrorBoundaryClass extends Component<
    PropsWithChildren,
    UncaughtErrorBoundaryState
> {
    state: UncaughtErrorBoundaryState = { error: null }

    static getDerivedStateFromError(error: Error): UncaughtErrorBoundaryState {
        return { error }
    }

    render() {
        if (this.state.error) {
            return (
                <div className={classes.uncaughtErrorBoundary}>
                    <NoticeBox error title={i18n.t('An error occurred')}>
                        {this.state.error.message}
                    </NoticeBox>
                </div>
            )
        }
        return this.props.children
    }
}

const GlobalErrorCatcher = () => {
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const onError = (e: ErrorEvent) => setError(e.error)
        const onRejection = (e: PromiseRejectionEvent) =>
            setError(
                e.reason instanceof Error
                    ? e.reason
                    : new Error(String(e.reason))
            )

        window.addEventListener('error', onError)
        window.addEventListener('unhandledrejection', onRejection)
        return () => {
            window.removeEventListener('error', onError)
            window.removeEventListener('unhandledrejection', onRejection)
        }
    }, [])

    if (error) {
        throw error
    }

    return null
}

export const UncaughtErrorBoundary = ({ children }: PropsWithChildren) => (
    <UncaughtErrorBoundaryClass>
        <GlobalErrorCatcher />
        {children}
    </UncaughtErrorBoundaryClass>
)
