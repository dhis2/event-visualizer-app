export const expectInterpretationFormToBeVisible = () =>
    cy
        .getByDataTest('interpretation-form')
        .find('input[placeholder="Write an interpretation"]')
        .should('be.visible')
