export const clickToolbarViewButton = () =>
    cy.getByDataTest('dhis2-analytics-hovermenubar').contains('View').click()

export const clickToolbarInterpretationsButton = () =>
    cy.getByDataTest('interpretations-and-details-toggler').click()
