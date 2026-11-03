import { downloadUrlFor, stubWindowOpen } from '../helpers'

const LINE_LIST_ID = 't6SxiQdVPVs'
const PIVOT_TABLE_ID = 't6KrUiPqcd0'

const PLAIN_DOWNLOADS = [
    ['HTML+CSS (.html+css)'],
    ['JSON', 'ID'],
    ['CSV', 'Name'],
    ['Microsoft Excel', 'Code'],
]

const expectDownloadToBeServed = (menuPath: string[], urlPart = '') =>
    downloadUrlFor(menuPath).then((url) => {
        expect(url).to.contain(urlPart)
        cy.request(url).its('status').should('equal', 200)
    })

describe('download', () => {
    it('serves the line list downloads', () => {
        cy.visit(`/#/${LINE_LIST_ID}`)
        cy.getByDataTest('table-row').should('have.length.greaterThan', 0)
        stubWindowOpen()

        PLAIN_DOWNLOADS.forEach((menuPath) =>
            expectDownloadToBeServed(menuPath)
        )
    })

    it('serves the pivot table downloads', () => {
        cy.visit(`/#/${PIVOT_TABLE_ID}`)
        cy.getByDataTest('visualization-container').should('be.visible')
        stubWindowOpen()

        PLAIN_DOWNLOADS.forEach((menuPath) =>
            expectDownloadToBeServed(menuPath)
        )
    })

    /* The backend rejects the request with E7125: analytics/dataValueSet
     * doesn't know the stage-prefixed dimensions of an event pivot table. */
    it.skip('serves the pivot table data value set', () => {
        cy.visit(`/#/${PIVOT_TABLE_ID}`)
        cy.getByDataTest('visualization-container').should('be.visible')
        stubWindowOpen()

        expectDownloadToBeServed(['Advanced', 'JSON'], '/dataValueSet')
    })
})
