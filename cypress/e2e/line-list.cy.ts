const EVENT_LINE_LIST_ID = 't6SxiQdVPVs'

const getRows = () => cy.getByDataTest('table-row')

const readAges = ($rows: JQuery<HTMLElement>, ageColumn: number) =>
    [...$rows]
        .slice(0, 5)
        .map((row) => Number(row.children[ageColumn].textContent))

const getAgeColumn = () =>
    cy
        .getByDataTest('data-table-header')
        .contains('Age in years')
        .parents('th')
        .invoke('index')

/* Waits for the request with the new sort order, so the rows read afterwards
 * are the sorted ones. */
const sortByAge = (direction: 'asc' | 'desc') => {
    cy.intercept({ method: 'GET', url: /\/analytics\/events\/query\// }).as(
        'analytics'
    )
    cy.getByDataTest('data-table-header')
        .find('button[title*="Age in years"]')
        .click()
    cy.wait('@analytics').its('request.url').should('contain', `${direction}=`)
}

describe('line list', () => {
    beforeEach(() => {
        cy.visit(`/#/${EVENT_LINE_LIST_ID}`)
        getRows().should('have.length.greaterThan', 0)
    })

    it('sorts by a column', () => {
        getAgeColumn().then((ageColumn) => {
            sortByAge('asc')
            getRows().should(($rows) => {
                const ages = readAges($rows, ageColumn)
                expect(ages).to.deep.equal([...ages].sort((a, b) => a - b))
            })
            getRows().then(($rows) => {
                const [lowestAge] = readAges($rows, ageColumn)

                sortByAge('desc')
                getRows().should(($sortedRows) => {
                    const ages = readAges($sortedRows, ageColumn)
                    expect(ages).to.deep.equal([...ages].sort((a, b) => b - a))
                    expect(ages[0]).to.be.greaterThan(lowestAge)
                })
            })
        })
    })

    it('pages through the rows', () => {
        getRows()
            .first()
            .invoke('text')
            .then((firstRowText) => {
                cy.getByDataTest('dhis2-uiwidgets-pagination-page-next').click()
                cy.getByDataTest('dhis2-uiwidgets-pagination-summary').should(
                    'contain',
                    'Page 2'
                )
                getRows().first().should('not.have.text', firstRowText)
            })

        cy.getByDataTest('dhis2-uiwidgets-pagination-pagesize-select').click()
        cy.getByDataTest('dhis2-uicore-singleselectoption')
            .contains(/^50$/)
            .click()
        getRows().should('have.length', 50)
    })

    it('opens a dimension modal from a header', () => {
        cy.getByDataTest('data-table-header').contains('span', 'Gender').click()
        cy.getByDataTest('dimension-modal-title').should('contain', 'Gender')
    })
})
