const getLineListTable = () => cy.getByDataTest('line-list-data-table')

export const expectTableToBeVisible = () => {
    expectTableOverlayNotToExist()
    return getLineListTable().find('tbody').should('be.visible')
}

export const expectTableOverlayNotToExist = () =>
    cy.getByDataTest('fetch-overlay').should('not.exist')
