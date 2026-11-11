import { interceptLineListAnalytics, sortColumn } from '../helpers'
import { getHeaderTexts } from '../support/rendering'

const EVENT_LINE_LIST_ID = 't6SxiQdVPVs'
const ENROLLMENT_LINE_LIST_ID = 'kUbNtOy0T12'
const TRACKED_ENTITY_LINE_LIST_ID = 'IS74uKRvJvl'
const AGE_DIMENSION = 'Zj7UnCAulEk.qrur9Dvnyt5'
const DEFAULT_CELL_BACKGROUND_COLOR = 'rgb(255, 255, 255)'

type Pager = { total: number; pageCount: number }

const getRows = () => cy.getByDataTest('table-row')

const openLineList = (id = EVENT_LINE_LIST_ID) => {
    cy.visit(`/#/${id}`)
    getRows().should('have.length.greaterThan', 0)
}

/* Whether the server reports row totals depends on its analytics database, so
 * the paging tests set the capability themselves. */
const interceptTotalsCapability = (analyticsTotalCounts: boolean) =>
    cy.intercept({ method: 'GET', url: '**/api/system/info' }, (req) => {
        req.continue((res) => {
            res.body.capability = {
                ...res.body.capability,
                analyticsTotalCounts,
            }
        })
    })

const waitForTotalPagesParam = (expected: string) =>
    cy.wait('@lineListAnalytics').then(({ request, response }) => {
        expect(new URL(request.url).searchParams.get('totalPages')).to.equal(
            expected
        )
        return response?.body.metaData.pager
    })

const goToPageTwo = () =>
    getRows()
        .first()
        .invoke('text')
        .then((firstRowText) => {
            cy.getByDataTest('pagination-next').click()
            cy.getByDataTest('pagination-page-input').should('have.value', '2')
            getRows().first().should('not.have.text', firstRowText)
        })

const choosePageSize = (pageSize: number) => {
    cy.getByDataTest('pagination-options').click()
    cy.getByDataTest('pagination-page-size-select')
        .findByDataTest('dhis2-uicore-select-input')
        .click()
    cy.getByDataTest('dhis2-uicore-singleselectoption')
        .contains(new RegExp(`^${pageSize}$`))
        .click()
    getRows().should('have.length', pageSize)
}

describe('line list', () => {
    it('sorts by a column', () => {
        openLineList()

        sortColumn('Age in years', 'asc', AGE_DIMENSION)
        sortColumn('Age in years', 'desc', AGE_DIMENSION)
    })

    const lineLists = [
        { outputType: 'event', id: EVENT_LINE_LIST_ID },
        { outputType: 'enrollment', id: ENROLLMENT_LINE_LIST_ID },
        { outputType: 'tracked entity', id: TRACKED_ENTITY_LINE_LIST_ID },
    ]

    lineLists.forEach(({ outputType, id }) => {
        it(`pages through the rows without totals (${outputType})`, () => {
            interceptTotalsCapability(false)
            interceptLineListAnalytics()
            openLineList(id)

            waitForTotalPagesParam('false')
            cy.getByDataTest('pagination-row-count').should('not.exist')

            goToPageTwo()
            choosePageSize(50)
        })

        it(`pages through the rows with totals (${outputType})`, () => {
            interceptTotalsCapability(true)
            interceptLineListAnalytics()
            openLineList(id)

            waitForTotalPagesParam('true').then(
                ({ total, pageCount }: Pager) => {
                    cy.getByDataTest('pagination-row-count')
                        .invoke('text')
                        .then((text) =>
                            expect(text.replace(/\D/g, '')).to.equal(
                                String(total)
                            )
                        )
                    cy.getByDataTest('pagination-bar').should(
                        'contain.text',
                        `/${pageCount}`
                    )

                    goToPageTwo()
                    choosePageSize(50)
                    cy.getByDataTest('pagination-bar').should(
                        'contain.text',
                        `/${Math.ceil(total / 50)}`
                    )
                }
            )
        })
    })

    it('colours the cells by the legend set of each data item', () => {
        openLineList()

        cy.getByDataTest('visualization-legend-key')
            .should('contain', 'Age 10y interval')
            .and('contain', 'Weight in kg')
        cy.getByDataTest('data-table-header').then(($headers) => {
            const ageColumnIndex =
                getHeaderTexts($headers).indexOf('Age in years')
            getRows()
                .first()
                .findByDataTest('table-cell')
                .eq(ageColumnIndex)
                .should(
                    'not.have.css',
                    'background-color',
                    DEFAULT_CELL_BACKGROUND_COLOR
                )
        })
    })

    it('opens a dimension modal from a header', () => {
        openLineList()

        cy.getByDataTest('data-table-header').contains('span', 'Gender').click()
        cy.getByDataTest('dimension-modal-title').should('contain', 'Gender')
    })
})
