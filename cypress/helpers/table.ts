export const expectVisTitleToContain = (value) =>
    cy
        .getByDataTest('title-bar')
        .should('have.length', 1)
        .and('be.visible')
        .and('contain', value)

export const expectVisTitleToEqual = (value) =>
    cy
        .getByDataTest('title-bar')
        .containsExact(value)
        .should('have.length', 1)
        .and('be.visible')

const getLineListTable = () => cy.getByDataTest('line-list-data-table')

export const getTableHeaderCells = () => getLineListTable().find('th')

export const getTableRows = () => getLineListTable().find('tbody').find('tr')

export const getTableDataCells = () =>
    getLineListTable().find('tbody').find('td')

export const expectTableToBeVisible = () =>
    getLineListTable().find('tbody').should('be.visible')

export const expectTableToBeUpdated = () =>
    cy.getByDataTest('fetch-overlay', { timeout: 30000 }).should('not.exist')

export const expectTableToMatchRows = (expectedRows) => {
    getTableRows().should('have.length', expectedRows.length)

    expectedRows.forEach((value) => {
        expectTableToContainValue(value)
    })
}

export const expectTableToContainHeader = (header) => {
    getTableHeaderCells().contains(header)
}

export const expectTableToContainValue = (value) => {
    getTableDataCells().contains(value)
}

export const expectTableToNotContainValue = (value) => {
    getTableDataCells().contains(value).should('not.exist')
}

export const expectLegendKeyToBeHidden = () =>
    cy.getByDataTest('visualization-legend-key').should('not.exist')

export const expectLegendKeyToBeVisible = () =>
    cy.getByDataTest('visualization-legend-key').should('be.visible')

export const expectLegendKeyToMatchLegendSets = (legendSets) => {
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
