import { pluginBody } from '../../support/dashboard-plugin'

describe('dashboard plugin errors', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('shows the canvas error with a working retry for an unknown visualization', () => {
        /* Assert Retry refetches (the request count grows), not just that the
         * error text is still shown — that's already true before the click, so
         * a dead button would pass. A bad id fails at the eventVisualizations
         * fetch, so count those. */
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
        /* Valid id, so the failure lands on the analytics request — the other
         * place the fetch can fail. */
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
