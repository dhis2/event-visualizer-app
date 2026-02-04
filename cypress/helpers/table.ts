export const expectVisTitleToContain = (value: string) =>
    cy
        .getByDataTest('title-bar')
        .should('have.length', 1)
        .and('be.visible')
        .and('contain', value)

export const expectVisTitleToEqual = (value: string) =>
    cy
        .getByDataTest('title-bar')
        .should('have.length', 1)
        .and('contain.text', value)
        .and('be.visible')

const getLineListTable = () => cy.getByDataTest('line-list-data-table')

export const getTableHeaderCells = () => getLineListTable().find('th')

export const getTableRows = () => getLineListTable().find('tbody').find('tr')

export const getTableDataCells = () =>
    getLineListTable().find('tbody').find('td')

export const expectTableToBeVisible = () => {
    expectTableOverlayNotToExist()
    return getLineListTable().find('tbody').should('be.visible')
}

export const expectTableOverlayNotToExist = () =>
    cy.getByDataTest('fetch-overlay').should('not.exist')

export const expectTableToMatchRows = (expectedRows: string[]) => {
    getTableRows().should('have.length', expectedRows.length)

    expectedRows.forEach((value) => {
        expectTableToContainValue(value)
    })
}

export const expectTableToContainHeader = (header: string) => {
    getTableHeaderCells().contains(header)
}

export const expectTableToContainValue = (value: string) => {
    getTableDataCells().contains(value)
}

export const expectTableToNotContainValue = (value: string) => {
    getTableDataCells().contains(value).should('not.exist')
}

export const expectLegendKeyToBeHidden = () =>
    cy.getByDataTest('visualization-legend-key').should('not.exist')

export const expectLegendKeyToBeVisible = () =>
    cy.getByDataTest('visualization-legend-key').should('be.visible')

export const expectLegendKeyToMatchLegendSets = (legendSets: string[]) => {
    cy.getByDataTest('legend-key-container')
        .findByDataTestLike('legend-key-item')
        .should('have.length', legendSets.length)
    legendSets.forEach((legendSet) =>
        cy
            .getByDataTest('legend-key-container')
            .findByDataTestLike('legend-key-item')
            .contains(legendSet)
    )
}
