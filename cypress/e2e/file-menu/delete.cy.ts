import {
    // file-menu
    deleteVisualization,
    saveVisualizationAs,
    openVisByName,
    // table
    expectVisTitleToEqual,
    expectTableToBeVisible,
    expectStartScreenToBeVisible,
} from '../../helpers/index'

const TEST_VIS_TITLE = `delete-test-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}`

const createTestVisualization = (title) => {
    openVisByName('Inpatient: Cases last quarter (case)')

    // capture the current visualization id from the hash route BEFORE saving
    cy.location('hash').then((hash) => {
        const visId = hash.replace('#/', '')
        cy.wrap(visId).as('initialVisId')
    })

    // save as a new visualization for the test
    saveVisualizationAs(title)

    // after saving as a new visualization the id should have changed
    cy.get('@initialVisId').then((initialVisId) => {
        cy.location('hash').should('not.contain', initialVisId)
    })

    expectVisTitleToEqual(title)
    expectTableToBeVisible()
}

describe('delete', () => {
    it('delete fails', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        cy.intercept(
            {
                method: 'DELETE',
                url: /\/api\/\d+\/eventVisualizations\/\w+/,
                times: 1,
            },
            {
                statusCode: 403,
                body: {
                    httpStatus: 'Forbidden',
                    httpStatusCode: 403,
                    status: 'ERROR',
                    errorCode: 'E1006',
                },
            }
        )

        deleteVisualization()

        cy.getByDataTest('dhis2-uicore-alertbar')
            .contains("You don't have sufficient permissions.")
            .should('be.visible')
        cy.getByDataTest('dhis2-uicore-alertbar-dismiss').click()
        expectTableToBeVisible()
        expectVisTitleToEqual(TEST_VIS_TITLE)

        deleteVisualization() // clean up by deleting the test visualization
        expectStartScreenToBeVisible()
    })
})
