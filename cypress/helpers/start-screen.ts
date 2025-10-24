export const goToStartPage = () => {
    cy.visit('/').log(Cypress.env('dhis2BaseUrl'))
    expectStartScreenToBeVisible()
}

export const expectStartScreenToBeVisible = () =>
    cy.contains('Getting started').should('be.visible')
