import {
    deleteVisualization,
    expectColumnSort,
    interceptLineListAnalytics,
    sortColumn,
    expectStartScreenToBeVisible,
    expectVisTitleToEqual,
    renameVisualization,
    resaveVisualization,
    saveVisualizationAs,
} from '../../helpers'
import {
    copyVisualization,
    deleteVisualizationsByName,
    getCurrentUserId,
    getVisualization,
} from '../../support/api'
import { testObjectName } from '../../support/names'
import { getApiBaseUrl } from '../../support/utils'

const SOURCE_VISUALIZATION_ID = 't6SxiQdVPVs'
const AGE_DIMENSION = 'Zj7UnCAulEk.qrur9Dvnyt5'

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
    const names: string[] = []

    /* afterEach, because a retry starts the test again and may save another */
    afterEach(() => {
        names.splice(0).forEach(deleteVisualizationsByName)
    })

    it('saves, saves as, renames and deletes', () => {
        const name = testObjectName('file menu')
        names.push(name)
        copyVisualization(SOURCE_VISUALIZATION_ID, name).then((id) =>
            cy.visit(`/#/${id}`)
        )
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

                sortColumn('Age in years', 'asc', AGE_DIMENSION)
                cy.getByDataTest('title-bar').should('contain', 'Edited')

                resaveVisualization()

                cy.getByDataTest('title-bar').should('not.contain', 'Edited')
                interceptLineListAnalytics()
                cy.reload()
                cy.getByDataTest('table-row').should(
                    'have.length.greaterThan',
                    0
                )
                expectColumnSort('Age in years', 'asc', AGE_DIMENSION)
                expectSubscriber(id, userId)
            })
        })

        const copyName = testObjectName('file menu copy')
        const renamedName = `${copyName} renamed`
        names.push(copyName, renamedName)
        getIdFromHash().then((originalId) => {
            saveVisualizationAs(copyName)

            cy.location('hash').should('not.contain', originalId)
        })
        expectVisTitleToEqual(copyName)

        getIdFromHash().then((copyId) => {
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
