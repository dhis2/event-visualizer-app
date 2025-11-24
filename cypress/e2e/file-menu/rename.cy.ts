import {
    // file-menu
    createTestVisualization,
    deleteVisualization,
    renameVisualization,
    // table
    expectVisTitleToEqual,
    expectTableToBeVisible,
    expectStartScreenToBeVisible,
} from '../../helpers/index'

const TEST_VIS_TITLE = `rename-test-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}`

// TODO - enable this check once Interpretations and Details panel implemented
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

        cy.intercept('PUT', /\/api\/\d+\/eventVisualizations\/\w+/, (req) => {
            expect(req.body).to.have.property('subscribers')
            expect(req.body).to.have.property('filters')
        })

        // rename the AO, changing name only
        const renamedVisTitle = `${TEST_VIS_TITLE}-renamed`
        const description = 'Renamed visualization description'
        renameVisualization(renamedVisTitle, description)

        cy.getByDataTest('dhis2-uicore-alertbar')
            .contains('Rename successful')
            .should('be.visible')
        expectTableToBeVisible()
        expectVisTitleToEqual(renamedVisTitle)

        cy.reload(true)

        expectTableToBeVisible()
        expectVisTitleToEqual(renamedVisTitle)

        // expectDescriptionToEqual(description)

        deleteVisualization()
        cy.getByDataTest('title-bar').should('not.exist')

        expectStartScreenToBeVisible()
    })

    it('add and change and delete name and description', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        // rename the visualization, adding a description
        const renamedVisTitle = `${TEST_VIS_TITLE} - renamed`
        const description = 'Description - renamed'
        renameVisualization(renamedVisTitle, description)

        // expectDescriptionToEqual(description)

        expectTableToBeVisible()

        // rename the AO, replacing the description
        const secondRenamedVisTitle = `${renamedVisTitle} - renamed again`
        const secondRenamedVisDesc = 'Description - renamed again'
        renameVisualization(secondRenamedVisTitle, secondRenamedVisDesc)

        // expectDescriptionToEqual(secondRenamedVisDesc)

        expectTableToBeVisible()

        // enter empty strings for the name and description
        renameVisualization('', '')

        // expectDescriptionToEqual('No description')

        cy.reload(true)

        // title is not deleted
        expectVisTitleToEqual(secondRenamedVisTitle)
        // expectDescriptionToEqual('No description')

        deleteVisualization()
        cy.getByDataTest('title-bar').should('not.exist')
        expectStartScreenToBeVisible()
    })

    it('handles failure when renaming', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        expectVisTitleToEqual(TEST_VIS_TITLE)
        expectTableToBeVisible()

        cy.intercept('PUT', '**/api/*/eventVisualizations/*', {
            statusCode: 409,
        })

        // rename the AO, changing name only
        const renamedVisTitle = `${TEST_VIS_TITLE} - renamed`
        renameVisualization(renamedVisTitle)

        cy.getByDataTest('dhis2-uicore-alertbar')
            .contains('Rename failed')
            .should('be.visible')
        expectTableToBeVisible()
        expectVisTitleToEqual(TEST_VIS_TITLE)

        cy.reload(true)

        expectTableToBeVisible()
        expectVisTitleToEqual(TEST_VIS_TITLE)

        deleteVisualization()
        cy.getByDataTest('title-bar').should('not.exist')

        expectStartScreenToBeVisible()
    })
})
