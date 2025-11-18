import { clearInput, typeInput, clearTextarea, typeTextarea } from './common'
import { expectVisTitleToEqual, expectTableToBeVisible } from './table'

const ITEM_OPEN = 'file-menu-open'
const ITEM_SAVE = 'file-menu-save'
const ITEM_SAVEAS = 'file-menu-saveas'
const ITEM_RENAME = 'file-menu-rename'
const ITEM_DELETE = 'file-menu-delete'

export const createTestVisualization = (title: string) => {
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

export const resaveVisualization = () => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_SAVE).click()
}

export const saveVisualization = (name?: string) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_SAVE).click()

    if (name) {
        typeInput('file-menu-saveas-modal-name-content', name)
    }

    cy.getByDataTest('file-menu-saveas-modal-save').click()
}

export const saveVisualizationAs = (name?: string) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_SAVEAS).click()

    if (name) {
        clearInput('file-menu-saveas-modal-name-content')
        typeInput('file-menu-saveas-modal-name-content', name)
    }

    cy.getByDataTest('file-menu-saveas-modal-save').click()
}

export const deleteVisualization = () => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_DELETE).click()

    cy.getByDataTest('file-menu-delete-modal-delete').click()
}

export const renameVisualization = (name?: string, description?: string) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_RENAME).click()

    if (name !== undefined) {
        clearInput('file-menu-rename-modal-name-content')
        if (name.length > 0) {
            typeInput('file-menu-rename-modal-name-content', name)
        }
    }

    if (description !== undefined) {
        clearTextarea('file-menu-rename-modal-description-content')
        if (description.length > 0) {
            typeTextarea(
                'file-menu-rename-modal-description-content',
                description
            )
        }
    }

    cy.getByDataTest('file-menu-rename-modal-rename').click()
}

export const openVisByName = (name: string) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_OPEN).click()

    typeInput('open-file-dialog-modal-name-filter', name)

    cy.getByDataTest('open-file-dialog-modal').contains(name).click()

    expectVisTitleToEqual(name)
    expectTableToBeVisible()
}
