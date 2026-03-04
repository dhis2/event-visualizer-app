export const clickOptionsButton = () =>
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('Options').click()

export const openDataOptionsModal = () => {
    clickOptionsButton()
    cy.getByDataTest('options-menu-list').contains('Data').click()
}

export const openStyleOptionsModal = () => {
    clickOptionsButton()
    cy.getByDataTest('options-menu-list').contains('Style').click()
}

export const openLegendOptionsModal = () => {
    clickOptionsButton()
    cy.getByDataTest('options-menu-list').contains('Legend').click()
}
