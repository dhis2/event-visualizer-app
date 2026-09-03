import { pluginBody } from '../../support/dashboard-plugin'

const LINE_LIST_ID = 'TIuOzZ0ID0V'

/* Only what is specific to the plugin: it fetches and retries through
 * useDataQuery rather than the app's store, and a processing failure lands on
 * the plugin boundary. The screens themselves live in canvas-errors.cy.ts. */

describe('dashboard plugin errors', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('refetches the visualization when Retry is clicked', () => {
        /* Count eventVisualizations requests, where a bad id fails: the error
         * text is already there before the click, so a dead button would pass
         * an assertion on it. */
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
                    /* Without the program the layout dimensions have no
                     * context to resolve against, which throws during render. */
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
