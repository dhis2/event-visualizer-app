export const goToStartPage = (skipEval) => {
    cy.visit('/').log(Cypress.env('dhis2BaseUrl'))
    if (!skipEval) {
        expectStartScreenToBeVisible()
    }
}

export const expectStartScreenToBeVisible = () =>
    cy.contains('Getting started').should('be.visible')
