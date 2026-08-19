import { pluginBody } from '../../support/dashboard-plugin'

describe('dashboard plugin rendering', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('renders a line list inside the plugin iframe', () => {
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )

        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('renders a pivot table inside the plugin iframe', () => {
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'aDrb9UMVxt0'
        )

        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('swaps the rendered visualization when the id changes', () => {
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table', { timeout: 30000 }).should('be.visible')

        pluginBody()
            .find('table thead th')
            .its('length')
            .then((firstColumnCount) => {
                cy.getByDataTest('plugin-host-visualization-id-input')
                    .clear()
                    .type('PRVegIpABeb')

                /* Column count, not header text: it doesn't depend on
                 * translations or label edits, and it's a stable proxy for
                 * "the plugin re-rendered with the new props" since both
                 * fixtures are LINE_LIST and only their column sets differ
                 * (7 vs 21 columns, confirmed against the API). A test that
                 * only checks the table is visible again would pass even if
                 * the swap silently no-opped and kept showing the first
                 * visualization. */
                pluginBody()
                    .find('table thead th', { timeout: 30000 })
                    .its('length')
                    .should('not.equal', firstColumnCount)
            })
    })
})
