export const openOptions = (tab: 'Data' | 'Style') => {
    cy.getByDataTest('visualization-options-button').click()
    cy.getByDataTest('options-modal-tab-bar').contains(tab).click()
}

export const applyOptions = () => {
    cy.getByDataTest('options-modal-action-confirm').click()
    cy.getByDataTest('options-modal').should('not.exist')
}
