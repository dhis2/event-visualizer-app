import { CssVariables } from '@dhis2/ui'
import type { FC, ReactNode } from 'react'
import simleLineList from '../__fixtures__/e2e-enrollment.json'
import largeLineListWithLegend from '../__fixtures__/inpatient-cases-under-5-years-female-this-year-additional-columns-and-legends.json'
import noTimeDimension from '../__fixtures__/no-time-dimension.json'
import { LineList } from '../line-list'
import type { LineListAnalyticsData } from '../types'
import type { CurrentVisualization } from '@types'

const TestContainer: FC<{ children: ReactNode }> = ({ children }) => (
    <div style={{ width: '100vw', height: '100vh' }}>
        {children}
        <CssVariables colors spacers theme />
    </div>
)

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
                <TestContainer>
                    <LineList
                        analyticsData={
                            largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            largeLineListWithLegend.visualization as unknown as CurrentVisualization
                        }
                    />
                </TestContainer>
            )
        })
        it('shows an overlay that covers the table area while fetching', () => {
            cy.mount(
                <TestContainer>
                    <LineList
                        isFetching
                        analyticsData={
                            simleLineList.responses as unknown as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            simleLineList.visualization as unknown as CurrentVisualization
                        }
                    />
                </TestContainer>
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
                <TestContainer>
                    <LineList
                        analyticsData={
                            noTimeDimension.responses as unknown as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            noTimeDimension.visualization as unknown as CurrentVisualization
                        }
                        isInModal
                    />
                </TestContainer>
            )
        })
    }
)
