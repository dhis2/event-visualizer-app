export const switchVisualizationType = (name: 'Line list' | 'Pivot table') => {
    cy.getByDataTest('visualization-type-selector-button').click()
    cy.getByDataTest('visualization-type-selector-list').contains(name).click()
    cy.get('body').then(($body) => {
        if ($body.find('[data-test="conversion-confirmation-modal"]').length) {
            cy.getByDataTest('conversion-confirmation-modal')
                .find('button')
                .last()
                .click()
        }
    })
    cy.getByDataTest(
        'visualization-type-selector-currently-selected-text'
    ).should('contain', name)
}

const openChipMenu = (chipName: string) =>
    cy
        .contains('[data-test="layout-dimension-chip"]', chipName)
        .find('[data-test="chip-menu-button"]')
        .click({ force: true })

export const moveChipToAxis = (
    chipName: string,
    axisId: 'columns' | 'rows' | 'filters'
) => {
    openChipMenu(chipName)
    cy.get(`[data-test^="chip-menu-item-move-"][data-test$="-to-${axisId}"]`)
        .first()
        .click()
}

export const removeChip = (chipName: string) => {
    openChipMenu(chipName)
    cy.get('[data-test^="chip-menu-item-remove-"]').click()
}
