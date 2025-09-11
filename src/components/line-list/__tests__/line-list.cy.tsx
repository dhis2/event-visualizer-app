import { CssVariables } from '@dhis2/ui'
import type { FC, ReactNode } from 'react'
import simleLineList from '../__fixtures__/e2e_enrollment.json'
import noTimeDimension from '../__fixtures__/no_time_dimension.json'
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
                            simleLineList.responses as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            simleLineList.visualization as unknown as CurrentVisualization
                        }
                        page={1}
                        pageSize={50}
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
                            simleLineList.responses as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            simleLineList.visualization as unknown as CurrentVisualization
                        }
                        page={1}
                        pageSize={50}
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
        it.only('shows a "No time dimensions" warning when showing a LL without a time dimensions in a modal', () => {
            // TODO: implement as Vitest
            cy.mount(
                <TestContainer>
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
                        page={1}
                        pageSize={50}
                    />
                </TestContainer>
            )
        })
    }
)
