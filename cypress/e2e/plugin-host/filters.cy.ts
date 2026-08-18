import { pluginBody } from '../../support/plugin-host'

describe('plugin host filters', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('does not remount the canvas when the filter toggle is checked, since it is not applied', () => {
        cy.getByDataTest('plugin-host-filter-toggle').check()

        /* The filter is excluded from the request identity, so this no
         * longer remounts the canvas: the table stays up throughout and the
         * loading spinner a remount would show never appears. */
        pluginBody().find('table').should('be.visible')
        pluginBody()
            .find('[data-test="dhis2-uicore-circularloader"]')
            .should('not.exist')
    })

    it('warns that a filter was not applied, and can be dismissed', () => {
        cy.getByDataTest('plugin-host-filter-toggle').check()

        pluginBody()
            .find('[data-test="filters-not-applied-notice"]', {
                timeout: 30000,
            })
            .should('be.visible')

        pluginBody().findByDataTest('filters-not-applied-dismiss').click()

        pluginBody()
            .findByDataTest('filters-not-applied-notice')
            .should('not.exist')
    })
})
