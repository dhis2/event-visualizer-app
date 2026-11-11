import { downloadUrlFor, stubWindowOpen } from '../helpers'

const LINE_LIST_ID = 't6SxiQdVPVs'
const PIVOT_TABLE_ID = 't6KrUiPqcd0'

const PLAIN_DOWNLOADS: Array<{ menuPath: string[]; urlPart: string }> = [
    { menuPath: ['HTML+CSS (.html+css)'], urlPart: '.html+css?' },
    { menuPath: ['JSON', 'ID'], urlPart: '.json?' },
    { menuPath: ['CSV', 'Name'], urlPart: '.csv?' },
    { menuPath: ['Microsoft Excel', 'Code'], urlPart: '.xlsx?' },
]

const expectDownloadToBeServed = (menuPath: string[], urlPart: string) =>
    downloadUrlFor(menuPath).then((url) => {
        expect(url).to.contain(urlPart)
        cy.request(url).its('status').should('equal', 200)
    })

describe('download', () => {
    it('serves the line list downloads', () => {
        cy.visit(`/#/${LINE_LIST_ID}`)
        cy.getByDataTest('table-row').should('have.length.greaterThan', 0)
        stubWindowOpen()

        PLAIN_DOWNLOADS.forEach(({ menuPath, urlPart }) =>
            expectDownloadToBeServed(menuPath, urlPart)
        )
    })

    it('serves the pivot table downloads', () => {
        cy.visit(`/#/${PIVOT_TABLE_ID}`)
        cy.getByDataTest('visualization-container').should('be.visible')
        stubWindowOpen()

        PLAIN_DOWNLOADS.forEach(({ menuPath, urlPart }) =>
            expectDownloadToBeServed(menuPath, urlPart)
        )
    })
})
