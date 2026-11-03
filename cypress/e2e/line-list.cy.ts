import { sortColumn } from '../helpers'

const EVENT_LINE_LIST_ID = 't6SxiQdVPVs'
const AGE_DIMENSION = 'Zj7UnCAulEk.qrur9Dvnyt5'

const getRows = () => cy.getByDataTest('table-row')

describe('line list', () => {
    beforeEach(() => {
        cy.visit(`/#/${EVENT_LINE_LIST_ID}`)
        getRows().should('have.length.greaterThan', 0)
    })

    it('sorts by a column', () => {
        sortColumn('Age in years', 'asc', AGE_DIMENSION)
        sortColumn('Age in years', 'desc', AGE_DIMENSION)
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
