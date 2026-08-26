import { pluginBody } from '../../support/dashboard-plugin'

describe('dashboard plugin rendering', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('renders a line list inside the plugin iframe', () => {
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )

        pluginBody().find('table').should('be.visible')
    })

    it('renders a pivot table inside the plugin iframe', () => {
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'aDrb9UMVxt0'
        )

        pluginBody().find('table').should('be.visible')
    })

    it('swaps the rendered visualization when the id changes', () => {
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table').should('be.visible')

        pluginBody()
            .find('table thead th')
            .its('length')
            .then((firstColumnCount) => {
                cy.getByDataTest('plugin-host-visualization-id-input')
                    .clear()
                    .type('PRVegIpABeb')

                /* Assert the column count changes (7 vs 21 between these
                 * fixtures), not just that a table exists — a silent no-op swap
                 * would still show a table. Count, not header text, so it
                 * survives translations. */
                pluginBody()
                    .find('table thead th')
                    .its('length')
                    .should('not.equal', firstColumnCount)
            })
    })
})
