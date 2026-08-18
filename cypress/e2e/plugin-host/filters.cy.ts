import { pluginBody } from '../../support/plugin-host'

describe('plugin host filters', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
        cy.getByDataTest('plugin-host-visualization-select').select(
            'TIuOzZ0ID0V'
        )
        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('sends relativePeriodDate to the analytics request', () => {
        cy.intercept({ method: 'GET', url: '**/analytics/events/query/**' }).as(
            'analytics'
        )

        cy.getByDataTest('plugin-host-relative-period-date').clear()
        cy.getByDataTest('plugin-host-relative-period-date').type('2024-01-01')

        /* cy.type() fires one input event per character, and each one
         * remounts the canvas and requests analytics again, so several
         * requests land on the intercept queue for one field edit. Only the
         * last one carries the fully typed date, so check the last request
         * rather than the first one cy.wait('@analytics') would hand back. */
        cy.get('@analytics.all').should((requests) => {
            expect(requests.length).to.be.greaterThan(0)
            const lastRequest = requests[requests.length - 1] as unknown as {
                request: { url: string }
            }
            expect(lastRequest.request.url).to.include(
                'relativePeriodDate=2024-01-01'
            )
        })
    })

    it('remounts the canvas when an org unit filter changes', () => {
        cy.intercept({ method: 'GET', url: '**/analytics/events/query/**' }).as(
            'analytics'
        )

        cy.getByDataTest('plugin-host-org-unit-select').select('O6uvpzGd5pu')

        /* A refetch proves the filter change reached the plugin and remounted
         * the canvas; the request identity includes the filters. */
        cy.wait('@analytics')
        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
    })

    it('warns that an org unit filter was not applied, and can be dismissed', () => {
        cy.getByDataTest('plugin-host-org-unit-select').select('O6uvpzGd5pu')

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

    it('does not warn when only relativePeriodDate is set', () => {
        /* 2026-01-01 keeps the fixture's "this year" events (all dated in
         * 2026) in range, so the table renders instead of a no-data notice. */
        cy.getByDataTest('plugin-host-relative-period-date').type('2026-01-01')

        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
        pluginBody()
            .findByDataTest('filters-not-applied-notice')
            .should('not.exist')
    })
})
