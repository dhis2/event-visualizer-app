const LINE_LIST_ID = 'TIuOzZ0ID0V'

const visualizationRequest = `**/eventVisualizations/${LINE_LIST_ID}*`
/* A program UID, so the sidebar's .../query/dimensions request isn't caught. */
const analyticsRequest = /\/analytics\/events\/query\/[A-Za-z0-9]{11}(\?|$)/

/* The crash screen says "Something went wrong" too, so scope to the canvas. */
const canvasError = () => cy.getByDataTest('canvas-error')

/* React rethrows to the window even when an error boundary handles it, so
 * Cypress sees every error this suite provokes. Ignore only the provoked one. */
const ignoreProvokedError = (message: string) => {
    cy.on('uncaught:exception', (error) => !error.message.includes(message))
}

describe('canvas errors', () => {
    it('shows the screen for a backend error code the app recognises', () => {
        /* The shape a real analytics rejection has: 409 with the code in the
         * body. */
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

    it('shows the "No data available" screen for an analytics response with no rows', () => {
        cy.intercept(
            { method: 'GET', url: analyticsRequest },
            { statusCode: 200, body: { headers: [], rows: [], metaData: {} } }
        )

        ignoreProvokedError('No data')

        cy.visit(`/#/${LINE_LIST_ID}`)

        canvasError().should('contain.text', 'No data available')
        cy.contains('button', 'Retry').should('not.exist')
    })

    it('recovers from a failed visualization fetch when Retry is clicked', () => {
        /* Only the first fetch fails, so Retry shows as the table arriving. */
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
         * second one breaks deriving the data source. That failure is tagged
         * 'runtime' and rethrown out of the canvas to the shell boundary. */
        cy.intercept({ method: 'GET', url: visualizationRequest }, (req) => {
            req.continue((res) => {
                /* Normalisation appends the visualization's own program, so
                 * one extra entry makes two. */
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
