import { clearInput, typeInput, clearTextarea, typeTextarea } from './common'
import { expectVisTitleToEqual, expectTableToBeVisible } from './table'

export const ITEM_NEW = 'file-menu-new'
export const ITEM_OPEN = 'file-menu-open'
export const ITEM_SAVE = 'file-menu-save'
export const ITEM_SAVEAS = 'file-menu-saveas'
export const ITEM_RENAME = 'file-menu-rename'
export const ITEM_TRANSLATE = 'file-menu-translate'
export const ITEM_SHARING = 'file-menu-sharing'
export const ITEM_GETLINK = 'file-menu-getlink'
export const ITEM_DELETE = 'file-menu-delete'

export const resaveVisualization = () => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_SAVE).click()
}

export const saveVisualization = (name) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_SAVE).click()

    if (name) {
        typeInput('file-menu-saveas-modal-name-content', name)
    }

    cy.getByDataTest('file-menu-saveas-modal-save').click()
}

export const saveVisualizationAs = (name) => {
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

export const renameVisualization = (name, description = undefined) => {
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

export const openVisByName = (name) => {
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('File').click()

    cy.getByDataTest(ITEM_OPEN).click()

    typeInput('open-file-dialog-modal-name-filter', name)

    cy.getByDataTest('open-file-dialog-modal').contains(name).click()

    expectVisTitleToEqual(name)
    expectTableToBeVisible()
}
