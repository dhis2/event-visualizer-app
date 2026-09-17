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
    it('maps an empty response to a non-retryable "No data available" screen', () => {
        const display = getErrorDisplay(new EmptyResponseError())

        expect(display.title).toBe('No data available')
        expect(display.retryable).toBeFalsy()
        expect(display.icon).toBe('emptyBox')
    })

    it('maps a missing visualization to a non-retryable "not found" screen', () => {
        const display = getErrorDisplay(
            engineError({ httpStatusCode: 404, errorCode: 'E1005' })
        )

        expect(display.title).toBe('Visualization not found')
        expect(display.retryable).toBeFalsy()
        expect(display.icon).toBe('generic')
    })

    it('maps a known backend error code to its message, non-retryable', () => {
        const display = getErrorDisplay(engineError({ errorCode: 'E7120' }))

        expect(display.title).toBe('Restricted access')
        expect(display.description).toContain('organisation units')
        expect(display.retryable).toBeFalsy()
        expect(display.icon).toBe('data')
    })

    it('picks the first known code from the errorCodes list', () => {
        const display = getErrorDisplay(
            engineError({ errorCodes: ['E9999', 'E7132'] })
        )

        expect(display.description).toContain('indicator')
        expect(display.retryable).toBeFalsy()
    })

    it('prefers the primary errorCode over the errorCodes list', () => {
        const display = getErrorDisplay(
            engineError({ errorCode: 'E7120', errorCodes: ['E7132'] })
        )

        expect(display.description).toContain('organisation units')
    })

    it('prefers a known backend code over the access error type', () => {
        /* The code says more than the generic restricted-access copy. */
        const display = getErrorDisplay(
            engineError({ type: 'access', errorCode: 'E7120' })
        )

        expect(display.description).toContain('organisation units')
    })

    it('shows the server message when only the errorCodes list names codes', () => {
        /* A response with several error reports leaves errorCode unset and
         * fills errorCodes instead. */
        const display = getErrorDisplay(
            engineError({
                type: 'access',
                errorCodes: ['E7999', 'E7998'],
                message: 'Two things were wrong with the request',
            })
        )

        expect(display.title).toBe('Analytics request error')
        expect(display.description).toBe(
            'Two things were wrong with the request'
        )
    })

    it('maps an access error without a code to restricted access', () => {
        const display = getErrorDisplay(engineError({ type: 'access' }))

        expect(display.title).toBe('Restricted access')
        expect(display.retryable).toBeFalsy()
    })

    it('keeps a named code non-retryable by default', () => {
        const display = getErrorDisplay(engineError({ errorCode: 'E7128' }))

        expect(display.title).toBe('Too much data')
        expect(display.retryable).toBeFalsy()
    })

    it('offers a retry for a code that can succeed on a second attempt', () => {
        const display = getErrorDisplay(engineError({ errorCode: 'E7131' }))

        expect(display.description).toContain('took too long')
        expect(display.retryable).toBe(true)
    })

    it('shares one message across the codes for an unresolvable dimension', () => {
        const displays = ['E7222', 'E7223', 'E7224', 'E7226'].map((errorCode) =>
            getErrorDisplay(engineError({ errorCode }))
        )

        for (const display of displays) {
            expect(display.description).toContain('no longer valid')
            expect(display.retryable).toBeFalsy()
        }
    })

    it('prefers named copy over the server message for a 409 it recognises', () => {
        const display = getErrorDisplay(
            engineError({
                type: 'access',
                errorCode: 'E7245',
                message: 'Program stage `abc` does not belong to program `def`',
            })
        )

        expect(display.description).toContain('no longer part of its program')
    })

    it('matches E7121 in the code table rather than as a bare access error', () => {
        /* E7121 arrives as a 409, which the engine types 'access', and its copy
         * matches the no-code access screen. Ordering the code lookup first is
         * what keeps its case reachable. */
        const display = getErrorDisplay(
            engineError({
                type: 'access',
                errorCode: 'E7121',
                message: 'User: `admin` is not allowed to read data for x',
            })
        )

        expect(display.description).toContain(
            'access to the data in this visualization'
        )
        expect(display.description).not.toContain('is not allowed to read')
    })

    it('shows the server message for an unrecognised code on an access error', () => {
        /* Analytics rejects a bad request with a 409, which the engine types as
         * 'access'. Without this the user is told it is a permissions problem. */
        const display = getErrorDisplay(
            engineError({
                type: 'access',
                errorCode: 'E7250',
                message: 'Dimension is not a fully qualified: `abc.def`',
            })
        )

        expect(display.title).toBe('Analytics request error')
        expect(display.description).toBe(
            'Dimension is not a fully qualified: `abc.def`'
        )
        expect(display.retryable).toBeFalsy()
        expect(display.icon).toBe('generic')
    })

    it('uses the database icon when the data or its metadata is the problem', () => {
        const dataCodes = ['E7132', 'E7142', 'E7128', 'E7226', 'E7245']

        for (const errorCode of dataCodes) {
            expect(getErrorDisplay(engineError({ errorCode })).icon).toBe(
                'data'
            )
        }
    })

    it('uses the warning icon when the request or the system failed', () => {
        const genericCodes = ['E1005', 'E7131', 'E7144', 'E7145', 'E7209']

        for (const errorCode of genericCodes) {
            expect(getErrorDisplay(engineError({ errorCode })).icon).toBe(
                'generic'
            )
        }
    })

    it('names the problem in the title of every recognised code', () => {
        /* Reaching the code table means the backend told us what went wrong, so
         * no screen there may fall back to the catch-all title. */
        const allCodes = [
            'E1005',
            'E7120',
            'E7121',
            'E7123',
            'E7128',
            'E7131',
            'E7132',
            'E7142',
            'E7144',
            'E7145',
            'E7209',
            'E7217',
            'E7222',
            'E7223',
            'E7224',
            'E7226',
            'E7236',
            'E7245',
        ]

        for (const errorCode of allCodes) {
            expect(getErrorDisplay(engineError({ errorCode })).title).not.toBe(
                'Something went wrong'
            )
        }
    })

    it('falls back to a generic retryable server error', () => {
        const display = getErrorDisplay(engineError({ type: 'network' }))

        expect(display.title).toBe('Something went wrong')
        expect(display.retryable).toBe(true)
        expect(display.icon).toBe('generic')
    })
})
