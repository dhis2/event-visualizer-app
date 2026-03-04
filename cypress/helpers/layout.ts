export const clickMenubarUpdateButton = () =>
    cy.getByDataTest('dhis2-analytics-updatebutton').contains('Update').click()
