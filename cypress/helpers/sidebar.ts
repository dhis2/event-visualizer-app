export const selectDataSource = (name: string) => {
    cy.get('[role="combobox"]').click()
    cy.get('body').then(($body) => {
        if ($body.find('input[aria-label="Filter data sources"]').length) {
            cy.get('input[aria-label="Filter data sources"]').type(name)
        }
    })
    cy.contains('[role="option"]', name).click()
}

/* A data element can be in several stages of a tracker program, so an item can
 * be looked up within one stage's section. */
const getDimensionItem = (name: string, stage?: string) => {
    const item = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

    return stage
        ? cy
              .contains('[data-test="dimension-card-subsection-title"]', stage)
              .closest('[data-test="dimension-card-subsection"]')
              .contains('[data-test="dimension-item"]', item)
        : cy.contains('[data-test="dimension-item"]', item)
}

export const openDimensionModal = (name: string, stage?: string) => {
    getDimensionItem(name, stage).click()
    cy.getByDataTest('dimension-modal').should('be.visible')
}

export const addDimensionToColumns = (name: string, stage?: string) =>
    getDimensionItem(name, stage)
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
