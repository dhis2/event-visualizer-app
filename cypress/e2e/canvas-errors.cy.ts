const LINE_LIST_ID = 'TIuOzZ0ID0V'

const visualizationRequest = `**/eventVisualizations/${LINE_LIST_ID}*`
/* Matched on a program UID: the sidebar loads its dimensions from
 * analytics/events/query/dimensions, and only the data request should fail. */
const analyticsRequest = /\/analytics\/events\/query\/[A-Za-z0-9]{11}(\?|$)/

/* Scoping to the canvas error's own container keeps "Something went wrong" from
 * matching the app-shell crash screen, which uses the same words. */
const canvasError = () => cy.getByDataTest('canvas-error')

/* React rethrows to the window even when an error boundary handles it, so every
 * error this suite provokes reaches Cypress as an uncaught exception. Ignore
 * only the ones the test caused; anything else should still fail the test. */
const ignoreProvokedError = (message: string) => {
    cy.on('uncaught:exception', (error) => !error.message.includes(message))
}

describe('canvas errors', () => {
    it('shows the screen for a backend error code the app recognises', () => {
        /* A real analytics rejection: 409 with the code in the body. Proves the
         * whole chain — response shape, parseEngineError, getErrorDisplay —
         * lines up, which the unit tests can't show since they build the
         * parsed error by hand. */
        cy.intercept(
            { method: 'GET', url: analyticsRequest },
            {
                statusCode: 409,
                body: {
                    httpStatus: 'Conflict',
                    httpStatusCode: 409,
                    status: 'ERROR',
                    message: 'forced by test',
                    errorCode: 'E7217',
                },
            }
        )

        ignoreProvokedError('forced by test')

        cy.visit(`/#/${LINE_LIST_ID}`)

        canvasError().should('contain.text', 'Restricted access')
        canvasError().should('contain.text', 'access to event analytics')
        cy.contains('button', 'Retry').should('not.exist')
    })

    it('shows the "No data" screen for an analytics response with no rows', () => {
        cy.intercept(
            { method: 'GET', url: analyticsRequest },
            { statusCode: 200, body: { headers: [], rows: [], metaData: {} } }
        )

        ignoreProvokedError('No data')

        cy.visit(`/#/${LINE_LIST_ID}`)

        canvasError().should('contain.text', 'No data')
        cy.contains('button', 'Retry').should('not.exist')
    })

    it('recovers from a failed visualization fetch when Retry is clicked', () => {
        /* Only the first fetch fails, so Retry can be asserted by what the user
         * sees — the table arriving — rather than by counting requests. */
        let shouldFail = true

        cy.intercept({ method: 'GET', url: visualizationRequest }, (req) => {
            if (shouldFail) {
                shouldFail = false
                req.reply({
                    statusCode: 500,
                    body: { message: 'forced by test' },
                })
            } else {
                req.continue()
            }
        })

        ignoreProvokedError('An unknown error occurred')

        cy.visit(`/#/${LINE_LIST_ID}`)

        canvasError().should('contain.text', 'Something went wrong')

        cy.contains('button', 'Retry').click()

        cy.get('table').should('be.visible')
        canvasError().should('not.exist')
    })
})

describe('app crash screen', () => {
    it('shows the app-shell crash screen when the visualization cannot be processed', () => {
        /* An EVENT visualization must resolve to exactly one program, so a
         * second one makes deriving the data source fail. That is tagged
         * 'runtime' and rethrown out of the canvas, so the shell boundary takes
         * over. Editing the real response rather than inventing a body keeps
         * the failure at that step instead of earlier in the processing. */
        cy.intercept({ method: 'GET', url: visualizationRequest }, (req) => {
            req.continue((res) => {
                /* Normalisation appends the visualization's own program, so one
                 * extra entry is enough to make it ambiguous. */
                res.body.programDimensions = [
                    { id: 'secondProgrm', name: 'Second program' },
                ]
            })
        })

        ignoreProvokedError('Expected exactly one program in programDimensions')

        cy.visit(`/#/${LINE_LIST_ID}`)

        cy.contains('Something went wrong').should('be.visible')
        cy.contains('button', 'Show technical details').should('be.visible')
        canvasError().should('not.exist')
    })
})
