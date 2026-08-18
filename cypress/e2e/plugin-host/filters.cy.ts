import { pluginBody } from '../../support/plugin-host'

const currentYear = new Date().getFullYear()

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

    it('does not remount the canvas when an org unit filter changes, since it is not applied', () => {
        cy.getByDataTest('plugin-host-org-unit-select').select('O6uvpzGd5pu')

        /* ou is excluded from the request identity, so this no longer remounts
         * the canvas: the table stays up throughout and the loading spinner a
         * remount would show never appears. */
        pluginBody().find('table').should('be.visible')
        pluginBody()
            .find('[data-test="dhis2-uicore-circularloader"]')
            .should('not.exist')
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
        /* January 1st of the current year keeps the fixture's "this year"
         * events in range, so the table renders instead of a no-data notice. */
        cy.getByDataTest('plugin-host-relative-period-date').type(
            `${currentYear}-01-01`
        )

        pluginBody().find('table', { timeout: 30000 }).should('be.visible')
        pluginBody()
            .findByDataTest('filters-not-applied-notice')
            .should('not.exist')
    })
})
