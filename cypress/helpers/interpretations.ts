export const expectInterpretationsButtonToBeEnabled = () =>
    cy
        .getByDataTest('dhis2-analytics-toolbar')
        .contains('Interpretations and details')
        .should('be.enabled')

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
