import { useAlert } from '@dhis2/app-runtime'
import { useEffect } from 'react'

const extractMessageFromErrorEvent = (
    e: ErrorEvent | PromiseRejectionEvent
): string => {
    if (e instanceof PromiseRejectionEvent && e.reason instanceof Error) {
        return e.reason.message
    } else if (
        e instanceof PromiseRejectionEvent &&
        typeof e.reason === 'string'
    ) {
        return e.reason
    } else if (e instanceof ErrorEvent && e.error instanceof Error) {
        return e.error.message
    } else {
        return 'An unknown error occurred'
    }
}

export const useUncaughtErrorAlert = () => {
    const { show } = useAlert(extractMessageFromErrorEvent, { critical: true })

    useEffect(() => {
        window.addEventListener('error', show)
        window.addEventListener('unhandledrejection', show)
        return () => {
            window.removeEventListener('error', show)
            window.removeEventListener('unhandledrejection', show)
        }
    }, [show])
}
