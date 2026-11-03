const getLineListTable = () => cy.getByDataTest('line-list-data-table')

export const expectTableToBeVisible = () => {
    expectTableOverlayNotToExist()
    return getLineListTable().find('tbody').should('be.visible')
}

export const expectTableOverlayNotToExist = () =>
    cy.getByDataTest('fetch-overlay').should('not.exist')

type SortDirection = 'asc' | 'desc'

const getSortButton = (header: string) =>
    cy.getByDataTest('data-table-header').find(`button[title*="${header}"]`)

/* A program id, so the sidebar's .../query/dimensions request isn't caught */
export const interceptLineListAnalytics = () =>
    cy
        .intercept({
            method: 'GET',
            url: /\/analytics\/(events|enrollments|trackedEntities)\/query\/[A-Za-z0-9]{11}\?/,
        })
        .as('lineListAnalytics')

/* Ordering the rows is the backend's job: the app's part is asking for the
 * sort and showing it in the header. */
export const expectColumnSort = (
    header: string,
    direction: SortDirection,
    dimension: string
) => {
    cy.wait('@lineListAnalytics')
        .its('request.url')
        .then((url) =>
            expect(new URL(url).searchParams.get(direction)).to.equal(dimension)
        )
    getSortButton(header).find('svg').should('have.class', direction)
}

export const sortColumn = (
    header: string,
    direction: SortDirection,
    dimension: string
) => {
    interceptLineListAnalytics()
    getSortButton(header).click()
    expectColumnSort(header, direction, dimension)
}
