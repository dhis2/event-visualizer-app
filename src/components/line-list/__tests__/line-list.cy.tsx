import simleLineList from '../__fixtures__/e2e_enrollment.json'
import noTimeDimension from '../__fixtures__/no_time_dimension.json'
import { LineList } from '../line-list'
import type { LineListAnalyticsData } from '../types'
import type { CurrentVisualization } from '@types'

describe(
    'Line List',
    {
        viewportWidth: 1024,
        viewportHeight: 768,
    },
    () => {
        it.only('renders correctly', () => {
            // TODO: Implement as Vitest with snapshot
            cy.mount(
                <div style={{ width: '100vw', height: '100vh' }}>
                    <LineList
                        analyticsData={
                            simleLineList.responses as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            simleLineList.visualization as unknown as CurrentVisualization
                        }
                    />
                </div>
            )
        })
        it('shows an overlay that covers the table area while fetching', () => {
            cy.mount(
                <div style={{ width: '100vw', height: '100vh' }}>
                    <LineList
                        isFetching
                        analyticsData={
                            simleLineList.responses as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            simleLineList.visualization as unknown as CurrentVisualization
                        }
                    />
                </div>
            )

            cy.getByDataTest('dhis2-uicore-componentcover').should('be.visible')
            cy.getByDataTest('dhis2-uicore-circularloader').should('be.visible')

            // TODO: Tweak this once the implementation is more complete:
            // Show a LL with Legend and then assert the datatable is covered and the legend key is not
            cy.getByDataTest('data-table').should(($el) => {
                expect(Cypress.dom.isFocusable($el)).to.be.equal(false)
            })
        })
        it('shows a "No time dimensions" warning when showing a LL without a time dimensions in a modal', () => {
            // TODO: implement as Vitest
            cy.mount(
                <div style={{ width: '100vw', height: '100vh' }}>
                    <LineList
                        analyticsData={
                            noTimeDimension.responses as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            noTimeDimension.visualization as unknown as CurrentVisualization
                        }
                        isInModal
                    />
                </div>
            )
        })
    }
)
