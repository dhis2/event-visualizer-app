/* Line lists list every header, in order. Pivot tables list a few column and
 * row headers that don't depend on the data: period headers move with the
 * yearly date shift, and items without data drop out. A wide pivot table only
 * renders the columns in view, so the column headers are the leftmost ones. */
export type ExpectedRendering =
    | { type: 'LINE_LIST'; headers: string[] }
    | { type: 'PIVOT_TABLE'; columnHeaders: string[]; rowHeaders: string[] }

export type Container = () => Cypress.Chainable<JQuery<HTMLElement>>

export const getHeaderTexts = ($headers: JQuery<HTMLElement>) =>
    [...$headers].map((header) => header.innerText.replace(/\s+/g, ' ').trim())

const expectLineListToRender = (headers: string[], container: Container) => {
    container()
        .find('[data-test="data-table-header"]')
        .should(($headers) => {
            expect(getHeaderTexts($headers)).to.deep.equal(headers)
        })
    container()
        .find('[data-test="table-row"]')
        .should('have.length.greaterThan', 0)
}

const expectPivotTableToRender = (
    columnHeaders: string[],
    rowHeaders: string[],
    container: Container
) => {
    container()
        .find('[data-test="visualization-column-header"]')
        .should(($headers) => {
            expect(getHeaderTexts($headers)).to.include.members(columnHeaders)
        })
    container()
        .find('[data-test="visualization-row-header"]')
        .should(($headers) => {
            expect(getHeaderTexts($headers)).to.include.members(rowHeaders)
        })
    container()
        .find('[data-test="visualization-container"] tbody tr')
        .should('have.length.greaterThan', 0)
}

export const expectVisualizationToRender = (
    expected: ExpectedRendering,
    container: Container = () => cy.get<HTMLElement>('body')
) => {
    switch (expected.type) {
        case 'LINE_LIST':
            expectLineListToRender(expected.headers, container)
            break
        case 'PIVOT_TABLE':
            expectPivotTableToRender(
                expected.columnHeaders,
                expected.rowHeaders,
                container
            )
            break
    }
    container().find('[data-test="canvas-error"]').should('not.exist')
}
