import { pluginBody } from '../../support/dashboard-plugin'

describe('dashboard plugin errors', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('shows the canvas error with a working retry for an unknown visualization', () => {
        /* A bad id fails at the eventVisualizations fetch, not the analytics
         * one. Counting these requests, rather than re-checking the error
         * text, is what proves Retry does something: the error text alone is
         * already true before the click, so a decorative button that does
         * nothing would still pass a text-only assertion. */
        cy.intercept({ method: 'GET', url: '**/eventVisualizations/**' }).as(
            'vis'
        )

        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'notARealId1'
        )

        pluginBody().contains('Something went wrong').should('be.visible')

        pluginBody().contains('button', 'Retry').should('be.visible')

        cy.get('@vis.all')
            .its('length')
            .then((requestCountBeforeRetry) => {
                pluginBody().contains('button', 'Retry').click()

                cy.get('@vis.all')
                    .its('length')
                    .should('be.greaterThan', requestCountBeforeRetry)
            })
    })

    it('shows the canvas error when the analytics request itself fails', () => {
        /* A real visualization id, so the eventVisualizations fetch succeeds
         * and the failure is forced on the analytics request instead — the
         * other place a plugin's data fetch can fail. */
        cy.intercept(
            { method: 'GET', url: '**/analytics/events/query/**' },
            { statusCode: 500, body: { message: 'forced by test' } }
        )

        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )

        pluginBody().contains('Something went wrong').should('be.visible')
    })
})
