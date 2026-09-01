import { pluginBody } from '../../support/dashboard-plugin'

const LINE_LIST_ID = 'TIuOzZ0ID0V'

/* The error screens themselves are covered once, against the app, in
 * canvas-errors.cy.ts. What only the plugin can show is its own wiring: it
 * fetches and retries through useDataQuery instead of the app's store, and a
 * processing failure lands on the plugin boundary rather than the app-shell
 * crash screen. Errors thrown inside the plugin iframe don't reach the test
 * runner, so unlike the app spec this one needs no uncaught-exception guard. */

describe('dashboard plugin errors', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('refetches the visualization when Retry is clicked', () => {
        /* Assert the request count grows, not just that the error text is still
         * shown — that's already true before the click, so a dead button would
         * pass. A bad id fails at the eventVisualizations fetch, so count
         * those. */
        cy.intercept({ method: 'GET', url: '**/eventVisualizations/**' }).as(
            'vis'
        )

        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'notARealId1'
        )

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

    it('shows the plugin crash screen when the visualization cannot be processed', () => {
        cy.intercept(
            { method: 'GET', url: `**/eventVisualizations/${LINE_LIST_ID}*` },
            (req) => {
                req.continue((res) => {
                    /* Removing the program leaves the layout dimensions with no
                     * context to resolve against, which throws while the plugin
                     * renders. */
                    delete res.body.program
                    res.body.programDimensions = []
                })
            }
        )

        cy.getByDataTest('plugin-host-visualization-id-input').type(
            LINE_LIST_ID
        )

        pluginBody()
            .contains('There was a problem loading this plugin')
            .should('be.visible')
    })
})
