import {
    clickToolbarInterpretationsButton,
    clickToolbarViewButton,
    expectInterpretationFormToBeVisible,
    typeTextarea,
} from '../helpers'
import { deleteInterpretations } from '../support/api'
import { testObjectName } from '../support/names'
import { expectVisualizationToRender } from '../support/rendering'

const PIVOT_TABLE_ID = 't6KrUiPqcd0'

const clickViewMenuItem = (label: string) => {
    clickToolbarViewButton()
    cy.getByDataTest('dhis2-uicore-hovermenulistitem').contains(label).click()
}

/* Other runs may post interpretations on the same visualization, so the test
 * only looks at its own. */
const getInterpretation = (text: string) =>
    cy.getByDataTest('interpretations-list').contains('li', text)

describe('interpretations', () => {
    it('disables the interpretations panel without a saved visualization', () => {
        cy.visit('/#/new')

        cy.getByDataTest('interpretations-and-details-toggler').should(
            'be.disabled'
        )
        clickToolbarViewButton()
        cy.getByDataTest('dhis2-uicore-hovermenulistitem')
            .contains('Show interpretations and details')
            .parent()
            .should('have.class', 'disabled')
    })

    it('toggles the panel from the toolbar and the View menu', () => {
        cy.visit(`/#/${PIVOT_TABLE_ID}`)
        cy.getByDataTest('details-panel').should('not.exist')

        clickToolbarInterpretationsButton()
        cy.getByDataTest('details-panel').should('be.visible')
        expectInterpretationFormToBeVisible()
        clickToolbarInterpretationsButton()
        cy.getByDataTest('details-panel').should('not.exist')

        clickViewMenuItem('Show interpretations and details')
        cy.getByDataTest('details-panel').should('be.visible')
        clickViewMenuItem('Hide interpretations and details')
        cy.getByDataTest('details-panel').should('not.exist')
    })

    describe('an interpretation', () => {
        const text = testObjectName('interpretation')

        after(() => deleteInterpretations(PIVOT_TABLE_ID, text))

        it('writes, opens, replies to and deletes an interpretation', () => {
            const reply = 'E2E-IDV reply'
            cy.visit(`/#/${PIVOT_TABLE_ID}`)
            clickToolbarInterpretationsButton()

            cy.getByDataTest('interpretation-form')
                .find('input[placeholder="Write an interpretation"]')
                .click()
            typeTextarea('interpretation-form', text)
            cy.getByDataTest('interpretation-form')
                .contains('Post interpretation')
                .click()

            getInterpretation(text).contains('See interpretation').click()
            cy.getByDataTest('interpretation-modal').should('contain', text)
            expectVisualizationToRender(
                {
                    type: 'PIVOT_TABLE',
                    columnHeaders: ['Male', '0 - 10', '10 - 20'],
                    rowHeaders: ['Bo', 'Western Area', 'Total'],
                },
                () => cy.getByDataTest('interpretation-modal')
            )

            cy.getByDataTest('interpretation-modal')
                .find('input[placeholder="Write a reply"]')
                .click()
            typeTextarea('interpretation-modal', reply)
            cy.getByDataTest('interpretation-modal')
                .contains('button', 'Post reply')
                .click()
            cy.getByDataTest('interpretation-modal').should('contain', reply)

            cy.contains('Hide interpretation').click()
            cy.getByDataTest('interpretation-modal').should('not.exist')

            getInterpretation(text)
                .find('[data-test="interpretation-delete-button"]')
                .click()
            cy.getByDataTest('interpretations-list').should('not.contain', text)
        })
    })
})
