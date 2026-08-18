import { pluginBody } from '../../support/plugin-host'

describe('plugin host', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
    })

    it('renders a line list inside the plugin iframe', () => {
        cy.getByDataTest('plugin-host-visualization-select').select(
            'TIuOzZ0ID0V'
        )

        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('renders a pivot table inside the plugin iframe', () => {
        cy.getByDataTest('plugin-host-visualization-select').select(
            'aDrb9UMVxt0'
        )

        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('swaps the rendered visualization when the selection changes', () => {
        cy.getByDataTest('plugin-host-visualization-select').select(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table', { timeout: 30000 }).should('be.visible')

        cy.getByDataTest('plugin-host-visualization-select').select(
            'PRVegIpABeb'
        )

        /* Proves props reached the plugin over post-robot: a different
         * visualization has a different column set. */
        pluginBody()
            .find('table thead', { timeout: 30000 })
            .should('be.visible')
    })
})
