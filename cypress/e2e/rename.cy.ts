import {
    deleteVisualization,
    renameVisualization,
    saveVisualizationAs,
    openVisByName,
} from '../helpers/file-menu'
import { expectVisTitleToEqual, expectTableToBeVisible } from '../helpers/table'

const TEST_VIS_TITLE = `rename-test-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}`

const createTestVisualization = (title) => {
    openVisByName('Inpatient: Cases last quarter (case)')

    // save as a new visualization for the renaming test
    saveVisualizationAs(title)
    expectVisTitleToEqual(title)
    expectTableToBeVisible()
}

// const expectDescriptionToEqual = (value) => {
//     clickMenubarInterpretationsButton()
//     cy.getByDataTest('details-panel').should('be.visible')
//     cy.getByDataTest('details-panel')
//         .findByDataTestLike('details-panel-description-content')
//         .containsExact(value)
//     clickMenubarInterpretationsButton()
// }

describe('rename', () => {
    it('replace existing name works correctly', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        cy.intercept(
            'GET',
            /\/api\/\d+\/eventVisualizations\/\w+\?fields=.*/
        ).as('get-rename')

        cy.intercept('PUT', /\/api\/\d+\/eventVisualizations\/\w+/, (req) => {
            expect(req.body).to.have.property('subscribers')
            expect(req.body).to.have.property('filters')
        }).as('put-rename')

        // rename the AO, changing name only
        const renamedVisTitle = `${TEST_VIS_TITLE}-renamed`
        const description = 'Renamed visualization description'
        renameVisualization(renamedVisTitle, description)

        cy.wait('@get-rename')
        cy.wait('@put-rename')
        cy.wait('@get-rename')

        cy.getByDataTest('dhis2-uicore-alertbar')
            .contains('Rename successful')
            .should('be.visible')
        expectTableToBeVisible()
        expectVisTitleToEqual(renamedVisTitle)

        cy.reload(true)

        expectTableToBeVisible()
        expectVisTitleToEqual(renamedVisTitle)

        // expectDescriptionToEqual(description) // TODO

        deleteVisualization()
    })

    it('add and change and delete name and description', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        // rename the visualization, adding a description
        cy.intercept('PUT', '**/api/*/eventVisualizations/*').as('put-rename')
        const renamedVisTitle = `${TEST_VIS_TITLE} - renamed`
        const description = 'Description - renamed'
        renameVisualization(renamedVisTitle, description)

        cy.wait('@put-rename')

        // expectDescriptionToEqual(description) // TODO

        expectTableToBeVisible()

        cy.intercept('PUT', '**/api/*/eventVisualizations/*').as('put-rename2')

        // rename the AO, replacing the description
        const secondRenamedVisTitle = `${renamedVisTitle} - renamed again`
        const secondRenamedVisDesc = 'Description - renamed again'
        renameVisualization(secondRenamedVisTitle, secondRenamedVisDesc)
        cy.wait('@put-rename2')

        // expectDescriptionToEqual(secondRenamedVisDesc) // TODO

        expectTableToBeVisible()

        cy.intercept('PUT', '**/api/*/eventVisualizations/*').as('put-rename3')
        // enter empty strings for the name and description
        renameVisualization('', '')
        cy.wait('@put-rename3')

        // expectDescriptionToEqual('No description') // TODO

        cy.reload(true)

        // title is not deleted
        expectVisTitleToEqual(secondRenamedVisTitle)
        // expectDescriptionToEqual('No description') // TODO

        deleteVisualization()
    })

    it('handles failure when renaming', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        expectVisTitleToEqual(TEST_VIS_TITLE)
        expectTableToBeVisible()

        cy.intercept('PUT', '**/api/*/eventVisualizations/*', {
            statusCode: 409,
        }).as('put-rename')

        // rename the AO, changing name only
        const renamedVisTitle = `${TEST_VIS_TITLE} - renamed`
        renameVisualization(renamedVisTitle)

        cy.wait('@put-rename')

        cy.getByDataTest('dhis2-uicore-alertbar')
            .contains('Rename failed')
            .should('be.visible')
        expectTableToBeVisible()
        expectVisTitleToEqual(TEST_VIS_TITLE)

        cy.reload(true)

        expectTableToBeVisible()
        expectVisTitleToEqual(TEST_VIS_TITLE)

        deleteVisualization()
    })
})
