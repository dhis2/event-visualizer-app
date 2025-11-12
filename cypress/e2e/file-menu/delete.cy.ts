import {
    // file-menu
    createTestVisualization,
    deleteVisualization,
    // table
    expectVisTitleToEqual,
    expectTableToBeVisible,
    expectStartScreenToBeVisible,
} from '../../helpers/index'

const TEST_VIS_TITLE = `delete-test-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}`

describe('delete', () => {
    it('delete fails', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        // simulate error E1006
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

        createTestVisualization(TEST_VIS_TITLE)

        // simulate error E4030
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
                    errorCode: 'E4030',
                },
            }
        )

        deleteVisualization()

        cy.getByDataTest('dhis2-uicore-alertbar')
            .contains(
                "This visualization can't be deleted because it is used on one or more dashboards."
            )
            .should('be.visible')
        //cy.getByDataTest('dhis2-uicore-alertbar-dismiss').click()
        expectTableToBeVisible()
        expectVisTitleToEqual(TEST_VIS_TITLE)

        deleteVisualization() // clean up by deleting the test visualization
        expectStartScreenToBeVisible()
    })
})
