import type { EngineError } from '@api/parse-engine-error'
import i18n from '@dhis2/d2-i18n'
import type { CanvasErrorIcon } from './canvas-error-icon'
import { EmptyResponseError } from './empty-response-error'
import { getBackendErrorCodeDisplay } from './error-codes'

export type CanvasErrorDisplay = {
    icon: CanvasErrorIcon
    title: string
    description: string
    retryable: boolean
}

/* The display for the first recognised backend error code — checking the primary
 * errorCode and then the errorCodes list — or undefined if none is recognised. */
const findKnownBackendErrorDisplay = (error: EngineError) => {
    if (error.errorCode) {
        const display = getBackendErrorCodeDisplay(error.errorCode)
        if (display) {
            return display
        }
    }
    if (Array.isArray(error.errorCodes)) {
        for (const code of error.errorCodes) {
            const display = getBackendErrorCodeDisplay(code)
            if (display) {
                return display
            }
        }
    }
    return undefined
}

/* Single source of the user-facing canvas screen for any canvas error: an empty
 * response, a known backend error code, restricted access, or a generic server
 * problem. `retryable` drives whether CanvasError shows a Retry button. */
export const getErrorDisplay = (
    error: EngineError | EmptyResponseError
): CanvasErrorDisplay => {
    if (error instanceof EmptyResponseError) {
        return {
            icon: 'emptyBox',
            title: i18n.t('No data available'),
            description: i18n.t(
                "The selected dimensions didn't return any data. There may be no data, or you may not have access to it."
            ),
            retryable: false,
        }
    }

    const backendDisplay = findKnownBackendErrorDisplay(error)
    if (backendDisplay) {
        return { ...backendDisplay, retryable: false }
    }

    if (error.type === 'access') {
        return {
            icon: 'data',
            title: i18n.t('Restricted access'),
            description: i18n.t(
                "You don't have access to the data in this visualization. Contact a system administrator."
            ),
            retryable: false,
        }
    }

    return {
        icon: 'generic',
        title: i18n.t('Something went wrong'),
        description: i18n.t(
            'There was a problem getting the data from the server.'
        ),
        retryable: true,
    }
}
