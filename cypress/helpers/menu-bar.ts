export const clickMenubarUpdateButton = () =>
    cy.getByDataTest('dhis2-analytics-updatebutton').contains('Update').click()

export const clickMenubarViewButton = () =>
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('View').click()

export const clickMenubarOptionsButton = () =>
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('Options').click()

export const openDataOptionsModal = () => {
    clickMenubarOptionsButton()
    cy.getByDataTest('options-menu-list').contains('Data').click()
}

export const openStyleOptionsModal = () => {
    clickMenubarOptionsButton()
    cy.getByDataTest('options-menu-list').contains('Style').click()
}

export const openLegendOptionsModal = () => {
    clickMenubarOptionsButton()
    cy.getByDataTest('options-menu-list').contains('Legend').click()
}

export const clickMenubarInterpretationsButton = () =>
    cy
        .getByDataTest('dhis2-analytics-interpretationsanddetailstoggler')
        .contains('Interpretations and details')
        .click()
