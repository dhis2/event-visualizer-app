import {
    copyVisualization,
    deleteVisualizationsByName,
    getVisualization,
} from '../../support/api'
import { testObjectName } from '../../support/names'

const SOURCE_VISUALIZATION_ID = 't6SxiQdVPVs'

const openFileMenuItem = (dataTest: string) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()
    cy.getByDataTest(dataTest).click()
}

describe('share, translate and get link', () => {
    const names: string[] = []
    let copyId: string

    /* Each test, and each retry of it, gets a fresh copy */
    beforeEach(() => {
        const name = testObjectName('share')
        names.push(name)
        copyVisualization(SOURCE_VISUALIZATION_ID, name).then((id) => {
            copyId = id
            cy.visit(`/#/${id}`)
        })
        cy.getByDataTest('table-row').should('have.length.greaterThan', 0)
    })

    afterEach(() => {
        names.splice(0).forEach(deleteVisualizationsByName)
    })

    it('translates the name', () => {
        const translation = 'E2E-IDV traduction'
        openFileMenuItem('file-menu-translate')

        cy.getByDataTest('dhis2-analytics-translation-modal')
            .contains('Choose a locale')
            .click()
        cy.contains('Nederlands').click()
        cy.getByDataTest('dhis2-analytics-translation-modal')
            .find('tbody tr')
            .first()
            .find('textarea')
            .last()
            .type(translation)
        cy.getByDataTest('dhis2-analytics-translation-modal')
            .contains('button', 'Save translations')
            .click()
        cy.getByDataTest('dhis2-analytics-translation-modal').should(
            'not.exist'
        )

        getVisualization(copyId, 'translations')
            .its('translations')
            .should('deep.include', {
                property: 'NAME',
                locale: 'nl',
                value: translation,
            })
    })

    it('changes the public access', () => {
        openFileMenuItem('file-menu-sharing')

        /* All users is the copy's only access entry */
        cy.contains('All users').should('be.visible')
        cy.contains('View and edit').click()
        cy.contains('View only').click()
        cy.contains('button', 'Close').click()

        getVisualization(copyId, 'sharing[public]')
            .its('sharing.public')
            .should('equal', 'r-------')
    })

    it('shows a link to the visualization', () => {
        openFileMenuItem('file-menu-getlink')

        cy.get(`a[href*="${copyId}"]`).should('be.visible')
    })
})
