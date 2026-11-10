export const expectStartScreenToBeVisible = () =>
    cy.getByDataTest('start-screen').should('exist')
