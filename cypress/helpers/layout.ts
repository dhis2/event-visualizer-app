export const clickMenubarUpdateButton = () =>
    cy.getByDataTest('dhis2-analytics-updatebutton').contains('Update').click()

export const switchVisualizationType = (name: 'Line list' | 'Pivot table') => {
    cy.getByDataTest('visualization-type-selector-button').click()
    cy.getByDataTest('visualization-type-selector-list').contains(name).click()
    cy.get('body').then(($body) => {
        if ($body.find('[data-test="conversion-confirmation-modal"]').length) {
            cy.getByDataTest('conversion-confirmation-modal')
                .find('button')
                .last()
                .click()
        }
    })
    cy.getByDataTest(
        'visualization-type-selector-currently-selected-text'
    ).should('contain', name)
}
