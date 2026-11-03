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

export const sortColumn = (header: string, direction: SortDirection) => {
    getSortButton(header).click()
    getSortButton(header).find('svg').should('have.class', direction)
}

const getColumnIndex = (header: string) =>
    cy
        .getByDataTest('data-table-header')
        .contains(header)
        .parents('th')
        .invoke('index')

const readColumnValues = ($rows: JQuery<HTMLElement>, column: number) =>
    [...$rows]
        .slice(0, 5)
        .map((row) => Number(row.children[column].textContent))

const isSorted = (values: number[], direction: SortDirection) =>
    values.every(
        (value, index) =>
            index === 0 ||
            (direction === 'asc'
                ? values[index - 1] <= value
                : values[index - 1] >= value)
    )

/* Checks the first rows of a column of numbers. A test can add its own check,
 * which retries together with the order check. */
export const expectColumnToBeSorted = (
    header: string,
    direction: SortDirection,
    check: (values: number[]) => void = () => {}
) => {
    getSortButton(header).find('svg').should('have.class', direction)
    return getColumnIndex(header).then((column) =>
        cy
            .getByDataTest('table-row')
            .should(($rows) => {
                const values = readColumnValues($rows, column)
                expect(isSorted(values, direction), `${values}`).to.equal(true)
                check(values)
            })
            .then(($rows) => readColumnValues($rows, column))
    )
}
