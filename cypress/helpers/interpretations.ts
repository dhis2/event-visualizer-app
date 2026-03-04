export const expectInterpretationsButtonToBeEnabled = () =>
    cy.getByDataTest('interpretations-and-details-toggler').should('be.enabled')

export const expectInterpretationFormToBeVisible = () =>
    cy
        .getByDataTest('interpretation-form')
        .find('input[placeholder="Write an interpretation"]')
        .should('be.visible')

export const expectInterpretationThreadToBeVisible = () =>
    cy
        .getByDataTest('interpretation-modal')
        .find('input[placeholder="Write a reply"]')
        .should('be.visible')
