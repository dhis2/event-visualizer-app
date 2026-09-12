import type { EngineError } from '@api/parse-engine-error'
import i18n from '@dhis2/d2-i18n'
import type { CanvasErrorDisplay } from './canvas-error-display'
import { EmptyResponseError } from './empty-response-error'
import { getBackendErrorCodeDisplay, restrictedDataAccess } from './error-codes'

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
        }
    }

    const backendDisplay = findKnownBackendErrorDisplay(error)
    if (backendDisplay) {
        return backendDisplay
    }

    if (error.type === 'access') {
        /* The engine types 401, 403 and 409 alike, but only a 409 names an
         * error code. Codes we have copy for are matched above, so a code
         * reaching here is a request the backend refused rather than an access
         * problem. The server's message is shown untranslated: it names the
         * offending dimension, and the case it reports should not happen. */
        if (error.errorCode || error.errorCodes?.length) {
            return {
                icon: 'generic',
                title: i18n.t('Analytics request error'),
                description: error.message,
            }
        }

        return restrictedDataAccess()
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
