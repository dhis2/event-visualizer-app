import { pluginBody } from '../../support/plugin-host'

/* Matches the fixed pixel height host-page.tsx passes to Plugin, mirroring
 * how a real dashboard grid cell sizes an IframePlugin. */
const HOST_HEIGHT = 400

describe('plugin host errors and resizing', () => {
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

        pluginBody()
            .contains('Something went wrong', { timeout: 30000 })
            .should('be.visible')

        pluginBody()
            .contains('button', 'Retry', { timeout: 30000 })
            .should('be.visible')

        cy.get('@vis.all')
            .its('length')
            .then((requestCountBeforeRetry) => {
                pluginBody().contains('button', 'Retry').click()

                cy.get('@vis.all')
                    .its('length')
                    .should('be.greaterThan', requestCountBeforeRetry)
            })
    })

    it('honours the height the host passes and scrolls taller content', () => {
        cy.getByDataTest('plugin-host-visualization-select').select(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table', { timeout: 30000 }).should('be.visible')

        /* The real dashboard sizes the iframe from its grid cell rather than
         * from plugin content, so the frame must keep the height it was given
         * and let the content scroll inside it. */
        cy.get('[data-test="plugin-host-iframe-wrap"] iframe')
            .invoke('outerHeight')
            .should('eq', HOST_HEIGHT)

        /* The table is taller than the frame; if it scrolled inside a
         * fixed-height frame instead of growing the frame, the table's own
         * height still reflects its full content and exceeds HOST_HEIGHT. */
        pluginBody()
            .find('table')
            .then(($table) => {
                const tableHeight = $table[0].getBoundingClientRect().height
                cy.wrap(tableHeight).should('be.greaterThan', HOST_HEIGHT)
            })
    })
})
