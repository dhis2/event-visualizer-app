import simleLineList from '../__fixtures__/e2e_enrollment.json'
import { LineList } from '../line-list'
import type {
    LineListAnalyticsData,
    LineListTransformedVisualization,
} from '../types'

describe(
    'Line List',
    {
        viewportWidth: 1024,
        viewportHeight: 768,
    },
    () => {
        it.only('renders correctly', () => {
            cy.mount(
                <div style={{ width: '100vw', height: '100vh' }}>
                    <LineList
                        analyticsData={
                            simleLineList.responses as LineListAnalyticsData
                        }
                        onDataSort={cy.stub().as('onDataSort')}
                        onPaginate={cy.stub().as('onPaginate')}
                        visualization={
                            simleLineList.visualization as LineListTransformedVisualization
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
                            simleLineList.visualization as LineListTransformedVisualization
                        }
                    />
                </div>
            )
        })
    }
)
