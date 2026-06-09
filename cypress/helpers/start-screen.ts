export const goToStartPage = () => {
    cy.visit('/').log(Cypress.expose('dhis2BaseUrl'))
    expectStartScreenToBeVisible()
}

export const expectStartScreenToBeVisible = () =>
    cy.getByDataTest('start-screen').should('exist')
