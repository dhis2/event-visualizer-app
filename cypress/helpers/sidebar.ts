export const selectDataSource = (name: string) => {
    cy.get('[role="combobox"]').click()
    cy.get('body').then(($body) => {
        if ($body.find('input[aria-label="Filter data sources"]').length) {
            cy.get('input[aria-label="Filter data sources"]').type(name)
        }
    })
    cy.contains('[role="option"]', name).click()
}

const getDimensionItem = (name: string) =>
    cy.contains('[data-test="dimension-item"]', new RegExp(`^${name}$`))

export const openDimensionModal = (name: string) => {
    getDimensionItem(name).click()
    cy.getByDataTest('dimension-modal').should('be.visible')
}

export const addDimensionToColumns = (name: string) =>
    getDimensionItem(name)
        .closest('[aria-roledescription="draggable item"]')
        .find('[data-test^="add-button-"]')
        .click({ force: true })

const ADD_BUTTON = 'dimension-modal-action-confirm'

export const addDimensionFromModal = (
    axisId: 'columns' | 'rows' | 'filters' | 'value'
) => {
    if (axisId === 'columns') {
        cy.getByDataTest(ADD_BUTTON).contains('Add to Columns').click()
    } else {
        cy.getByDataTest('dimension-modal-actions')
            .find('button')
            .last()
            .click()
        cy.getByDataTest(
            axisId === 'value'
                ? `${ADD_BUTTON}-flyout-menu-option-use-as-value`
                : `${ADD_BUTTON}-flyout-menu-option-${axisId}`
        ).click()
    }
    cy.getByDataTest('dimension-modal').should('not.exist')
}
