import { pluginBody } from '../../support/dashboard-plugin'

describe('dashboard plugin filters', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table').should('be.visible')
    })

    it('does not remount the canvas when the filter toggle is checked, since it is not applied', () => {
        cy.getByDataTest('plugin-host-filter-toggle').check()

        /* An unapplied filter isn't in the request identity, so the canvas
         * doesn't remount: the table stays and no spinner appears. */
        pluginBody().find('table').should('be.visible')
        pluginBody()
            .find('[data-test="dhis2-uicore-circularloader"]')
            .should('not.exist')
    })

    it('warns that a filter was not applied, and can be dismissed', () => {
        cy.getByDataTest('plugin-host-filter-toggle').check()

        pluginBody()
            .find('[data-test="filters-not-applied-notice"]')
            .should('be.visible')

        pluginBody().findByDataTest('filters-not-applied-dismiss').click()

        pluginBody()
            .findByDataTest('filters-not-applied-notice')
            .should('not.exist')
    })
})
