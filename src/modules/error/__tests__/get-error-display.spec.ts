import type { EngineError } from '@api/parse-engine-error'
import { describe, it, expect } from 'vitest'
import { EmptyResponseError } from '../empty-response-error'
import { getErrorDisplay } from '../get-error-display'

const engineError = (partial: Partial<EngineError>): EngineError => ({
    type: 'unknown',
    message: 'x',
    ...partial,
})

describe('getErrorDisplay', () => {
    it('maps an empty response to a non-retryable "No data" info screen', () => {
        const display = getErrorDisplay(new EmptyResponseError())

        expect(display.title).toBe('No data')
        expect(display.retryable).toBe(false)
        expect(display.severity).toBe('info')
    })

    it('maps a known backend error code to its message, non-retryable', () => {
        const display = getErrorDisplay(engineError({ errorCode: 'E7120' }))

        expect(display.title).toBe('Restricted access')
        expect(display.description).toContain('organisation units')
        expect(display.retryable).toBe(false)
        expect(display.severity).toBe('error')
    })

    it('picks the first known code from the errorCodes list', () => {
        const display = getErrorDisplay(
            engineError({ errorCodes: ['E9999', 'E7132'] })
        )

        expect(display.description).toContain('indicator')
        expect(display.retryable).toBe(false)
    })

    it('prefers the primary errorCode over the errorCodes list', () => {
        const display = getErrorDisplay(
            engineError({ errorCode: 'E7120', errorCodes: ['E7132'] })
        )

        expect(display.description).toContain('organisation units')
    })

    it('prefers a known backend code over the access error type', () => {
        /* An access rejection carries its own code, and that code says more
         * than the generic restricted-access copy. */
        const display = getErrorDisplay(
            engineError({ type: 'access', errorCode: 'E7120' })
        )

        expect(display.description).toContain('organisation units')
    })

    it('maps an access error without a code to restricted access', () => {
        const display = getErrorDisplay(engineError({ type: 'access' }))

        expect(display.title).toBe('Restricted access')
        expect(display.retryable).toBe(false)
    })

    it('falls back to a generic retryable server error', () => {
        const display = getErrorDisplay(engineError({ type: 'network' }))

        expect(display.title).toBe('Something went wrong')
        expect(display.retryable).toBe(true)
        expect(display.severity).toBe('error')
    })
})
