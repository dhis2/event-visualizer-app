import {
    typeTextarea,
    clickMenubarInterpretationsButton,
    clickMenubarViewButton,
    expectInterpretationsButtonToBeEnabled,
    expectInterpretationFormToBeVisible,
    expectInterpretationThreadToBeVisible,
    expectTableToBeVisible,
    openVisByName,
    deleteVisualization,
    saveVisualizationAs,
    expectVisTitleToEqual,
} from '../helpers'

const TEST_CANCEL_LABEL = 'Cancel'
const TEST_POST_INTERPRETATION_LABEL = 'Post interpretation'
const TEST_WRITE_INTERPRETATION_LABEL = 'Write an interpretation'
const TEST_INTERPRETATION_TEXT = 'Test interpretation'

describe('interpretations', () => {
    beforeEach(() => {
        cy.visit('/')
    })

    it('the interpretations button and item in View menu are disabled without a saved visualization', () => {
        cy.getByDataTest('dhis2-analytics-toolbar')
            .contains('Interpretations and details')
            .should('be.disabled')

        clickMenubarViewButton()

        cy.getByDataTest('dhis2-uicore-hovermenulistitem')
            .contains('Show interpretations and details')
            .parent()
            .should('have.class', 'disabled')
    })

    it('the interpretations and details panel can be toggled by clicking the button in the menu bar', () => {
        openVisByName('Inpatient: Cases last quarter (case)')

        expectInterpretationsButtonToBeEnabled()

        cy.getByDataTest('details-panel').should('not.exist')

        clickMenubarInterpretationsButton()

        cy.getByDataTest('details-panel').should('be.visible')

        cy.getByDataTest('details-panel').contains('Interpretations')
        expectInterpretationFormToBeVisible()

        clickMenubarInterpretationsButton()

        cy.getByDataTest('details-panel').should('not.exist')
    })

    it('the interpretations and details panel can be toggled by clicking the option in the view menu', () => {
        openVisByName('Inpatient: Cases last quarter (case)')

        cy.getByDataTest('details-panel').should('not.exist')

        clickMenubarViewButton()

        cy.getByDataTest('dhis2-uicore-hovermenulistitem')
            .contains('Show interpretations and details')
            .should('be.visible')
            .click()

        cy.getByDataTest('details-panel').should('be.visible')

        cy.getByDataTest('details-panel').contains('Interpretations')
        expectInterpretationFormToBeVisible()

        clickMenubarViewButton()

        cy.getByDataTest('dhis2-uicore-hovermenulistitem')
            .contains('Hide interpretations and details')
            .should('be.visible')
            .click()

        cy.getByDataTest('details-panel').should('not.exist')
    })

    it('a new interpretation can be added, viewed and deleted', () => {
        openVisByName('Inpatient: Cases last quarter (case)')

        // Make a copy of the visualization
        const visTitle = `INTERPRETATIONS TEST ${new Date().toLocaleString()}`
        saveVisualizationAs(visTitle)

        expectVisTitleToEqual(visTitle)
        expectTableToBeVisible()

        clickMenubarInterpretationsButton()

        // the rich text editor shows when clicking the input
        cy.getByDataTest('interpretation-form')
            .find(`input[placeholder="${TEST_WRITE_INTERPRETATION_LABEL}"]`)
            .click()

        cy.getByDataTest('interpretation-form').contains(
            TEST_POST_INTERPRETATION_LABEL
        )
        cy.getByDataTest('interpretation-form').contains(TEST_CANCEL_LABEL)

        // the rich text editor is removed when clicking Cancel
        cy.getByDataTest('interpretation-form')
            .contains(TEST_CANCEL_LABEL)
            .click()

        cy.getByDataTest('interpretation-form').should(
            'not.contain',
            TEST_POST_INTERPRETATION_LABEL
        )
        cy.getByDataTest('interpretation-form').should(
            'not.contain',
            TEST_CANCEL_LABEL
        )

        // it's possible to write a new interpretation text
        cy.getByDataTest('interpretation-form')
            .find(`input[placeholder="${TEST_WRITE_INTERPRETATION_LABEL}"]`)
            .click()

        typeTextarea('interpretation-form', TEST_INTERPRETATION_TEXT)

        // the new interpretation can be saved and shows up in the list
        cy.getByDataTest('interpretation-form')
            .contains(TEST_POST_INTERPRETATION_LABEL)
            .click()

        cy.getByDataTest('interpretations-list').contains(
            TEST_INTERPRETATION_TEXT
        )

        // The interpretation can be opened in the modal
        cy.getByDataTest('interpretations-list')
            .contains('See interpretation')
            .click()
        cy.getByDataTest('interpretation-modal').contains(
            'Viewing interpretation:'
        )
        cy.getByDataTest('interpretation-modal').contains(
            TEST_INTERPRETATION_TEXT
        )

        // it's possible to add a comment to the new interpretation
        expectInterpretationThreadToBeVisible()

        // the interpretation modal can be closed
        cy.contains('Hide interpretation').click()

        // the interpretation modal can be opened with the reply form focused
        cy.getByDataTest('interpretation-reply-button').click()
        cy.getByDataTest('interpretation-modal').contains(
            'Viewing interpretation:'
        )
        cy.getByDataTest('interpretation-modal').contains(
            TEST_INTERPRETATION_TEXT
        )

        expectInterpretationThreadToBeVisible()

        // this should test the initialFocus feature where when clicking the Reply button
        // the modal is opened with the reply form focused
        cy.getByDataTest('interpretation-modal').contains('Post reply')

        cy.contains('Hide interpretation').click()

        // the interpretation can be removed
        cy.getByDataTest('interpretation-delete-button').click()

        expectInterpretationFormToBeVisible()

        cy.getByDataTest('details-panel').should(
            'not.contain',
            TEST_INTERPRETATION_TEXT
        )

        deleteVisualization()
    })
})
