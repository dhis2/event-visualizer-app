import {
    deleteVisualization,
    expectStartScreenToBeVisible,
    expectVisTitleToEqual,
    renameVisualization,
    resaveVisualization,
    saveVisualizationAs,
} from '../../helpers'
import {
    copyVisualization,
    deleteVisualizationViaApi,
    getCurrentUserId,
    getVisualization,
} from '../../support/api'
import { testObjectName } from '../../support/names'
import { getApiBaseUrl } from '../../support/utils'

const SOURCE_VISUALIZATION_ID = 't6SxiQdVPVs'

const getIdFromHash = () =>
    cy
        .location('hash')
        .should('match', /^#\/[A-Za-z0-9]{11}$/)
        .then((hash) => hash.slice(2))

const showDetailsPanel = () => {
    cy.getByDataTest('details-panel').should('not.exist')
    cy.getByDataTest('interpretations-and-details-toggler').click()
    cy.getByDataTest('details-panel').should('be.visible')
}

const expectSubscriber = (visualizationId: string, userId: string) =>
    getVisualization(visualizationId, 'subscribers')
        .its('subscribers')
        .should('include', userId)

describe('file menu', () => {
    const createdIds: string[] = []

    after(() => {
        createdIds.forEach(deleteVisualizationViaApi)
    })

    it('saves, saves as, renames and deletes', () => {
        copyVisualization(
            SOURCE_VISUALIZATION_ID,
            testObjectName('file menu')
        ).then((id) => {
            createdIds.push(id)
            cy.visit(`/#/${id}`)
        })
        cy.getByDataTest('table-row').should('have.length.greaterThan', 0)

        getIdFromHash().then((id) => {
            getCurrentUserId().then((userId) => {
                showDetailsPanel()
                cy.getByDataTest('details-panel')
                    .contains('button', /^Subscribe$/)
                    .click()
                cy.getByDataTest('details-panel')
                    .contains('button', 'Unsubscribe')
                    .should('be.visible')
                expectSubscriber(id, userId)

                cy.getByDataTest('data-table-header')
                    .find('button[title*="Age in years"]')
                    .click()
                cy.getByDataTest('title-bar').should('contain', 'Edited')

                resaveVisualization()

                cy.getByDataTest('title-bar').should('not.contain', 'Edited')
                cy.reload()
                cy.getByDataTest('table-row').should(
                    'have.length.greaterThan',
                    0
                )
                getVisualization(id, 'sorting')
                    .its('sorting')
                    .should('have.length', 1)
                expectSubscriber(id, userId)
            })
        })

        const copyName = testObjectName('file menu copy')
        getIdFromHash().then((originalId) => {
            saveVisualizationAs(copyName)

            cy.location('hash').should('not.contain', originalId)
        })
        expectVisTitleToEqual(copyName)

        getIdFromHash().then((copyId) => {
            createdIds.push(copyId)

            const renamedName = `${copyName} renamed`
            const description = 'E2E-IDV description'
            renameVisualization(renamedName, description)

            cy.getByDataTest('dhis2-uicore-alertbar')
                .contains('Rename successful')
                .should('be.visible')
            cy.reload()
            expectVisTitleToEqual(renamedName)
            showDetailsPanel()
            cy.getByDataTest('details-panel').should('contain', description)

            deleteVisualization()

            expectStartScreenToBeVisible()
            cy.request({
                url: `${getApiBaseUrl()}/eventVisualizations/${copyId}`,
                failOnStatusCode: false,
            })
                .its('status')
                .should('equal', 404)
        })
    })
})
