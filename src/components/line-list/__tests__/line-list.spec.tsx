import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import simpleLineList from '../__fixtures__/e2e-enrollment.json'
import largeLineListWithLegend from '../__fixtures__/inpatient-cases-under-5-years-female-this-year-additional-columns-and-legends.json'
import noTimeDimension from '../__fixtures__/no-time-dimension.json'
import { LineList } from '../line-list'
import type { LineListAnalyticsData } from '../types'
import type { CurrentVisualization } from '@types'

// Mock the DHIS2 connection status hook
const mockUseDhis2ConnectionStatus = vi.hoisted(() => vi.fn())
vi.mock('@dhis2/app-runtime', () => ({
    useDhis2ConnectionStatus: mockUseDhis2ConnectionStatus,
}))

// Helper function to render LineList with default props
const renderLineList = (
    analyticsData: LineListAnalyticsData,
    visualization: CurrentVisualization,
    additionalProps = {}
) => {
    const defaultProps = {
        analyticsData,
        visualization,
        onDataSort: vi.fn(),
        onPaginate: vi.fn(),
        isFetching: false,
        isInDashboard: false,
        isInModal: false,
    }

    return render(<LineList {...defaultProps} {...additionalProps} />)
}

describe('LineList', () => {
    beforeEach(() => {
        mockUseDhis2ConnectionStatus.mockClear()
        mockUseDhis2ConnectionStatus.mockReturnValue({ isDisconnected: false })
    })
    describe('Snapshot test', () => {
        it('renders large table with legend set correctly', () => {
            const { container } = renderLineList(
                largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                largeLineListWithLegend.visualization as unknown as CurrentVisualization
            )
            expect(container).toMatchSnapshot()
        })
    })

    describe('Sorting', () => {
        const onDataSort = vi.fn()
        const onColumnHeaderClick = vi.fn()

        beforeEach(() => {
            onDataSort.mockClear()
            onColumnHeaderClick.mockClear()
        })

        it('calls onDataSort when sort icon is clicked', async () => {
            const user = userEvent.setup()

            renderLineList(
                simpleLineList.responses as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                { onDataSort, onColumnHeaderClick }
            )

            // Find the first column header (ouname)
            const sortButton = screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })
            await user.click(sortButton)

            expect(onDataSort).toHaveBeenCalledWith({
                dimension: 'ouname',
                direction: 'ASC',
            })
        })

        it('calls onColumnHeaderClick when column header text is clicked', async () => {
            const user = userEvent.setup()

            renderLineList(
                simpleLineList.responses as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                { onDataSort, onColumnHeaderClick }
            )

            // Find the column header text (not the sort button)
            const headerText = screen.getByText('Organisation unit')
            await user.click(headerText)

            expect(onColumnHeaderClick).toHaveBeenCalledWith('ou')
        })

        it('shows default sort state when no sort is applied', () => {
            renderLineList(
                simpleLineList.responses as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                {
                    sortField: undefined,
                    sortDirection: undefined,
                    onDataSort,
                    onColumnHeaderClick,
                }
            )

            const sortButton = screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })
            expect(sortButton).toBeInTheDocument()
        })
    })

    describe('Pagination', () => {
        const onPaginate = vi.fn()

        beforeEach(() => {
            onPaginate.mockClear()
        })

        it('calls onPaginate when page is changed', async () => {
            const user = userEvent.setup()

            // Create data with multiple pages
            const multiPageData = {
                ...largeLineListWithLegend.responses,
                pager: {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                },
            }

            renderLineList(
                multiPageData as unknown as LineListAnalyticsData,
                largeLineListWithLegend.visualization as unknown as CurrentVisualization,
                { onPaginate }
            )

            const nextButton = screen.getByRole('button', { name: 'Next' })
            await user.click(nextButton)

            expect(onPaginate).toHaveBeenCalledWith({ page: 2 })
        })

        it('displays pagination information correctly', async () => {
            renderLineList(
                largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                largeLineListWithLegend.visualization as unknown as CurrentVisualization,
                { onPaginate }
            )

            // Verify the correct page size is displayed (default 100 from fixture)
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText(/rows per page/i)).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).toBeDisabled()
            expect(nextButton).not.toBeDisabled()

            expect(screen.getByText(/page 1, row 1-100/i)).toBeInTheDocument()
        })

        it('shows correct pagination state for first page', () => {
            const firstPageData = {
                ...simpleLineList.responses,
                pager: {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                },
            }

            renderLineList(
                firstPageData as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                { onPaginate }
            )

            expect(screen.getByText(/page 1/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).toBeDisabled()
            expect(nextButton).not.toBeDisabled()
        })

        it('shows correct pagination state for middle page', () => {
            const middlePageData = {
                ...largeLineListWithLegend.responses,
                pager: {
                    page: 2,
                    pageSize: 100,
                    isLastPage: false,
                },
            }

            renderLineList(
                middlePageData as unknown as LineListAnalyticsData,
                largeLineListWithLegend.visualization as unknown as CurrentVisualization,
                { onPaginate }
            )

            expect(screen.getByText(/page 2/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText(/row 101-200/i)).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).not.toBeDisabled()
            expect(nextButton).not.toBeDisabled()
        })

        it('shows correct pagination state for last page', () => {
            const lastPageData = {
                ...largeLineListWithLegend.responses,
                pager: {
                    page: 3,
                    pageSize: 100,
                    isLastPage: true,
                },
            }

            renderLineList(
                lastPageData as unknown as LineListAnalyticsData,
                largeLineListWithLegend.visualization as unknown as CurrentVisualization,
                { onPaginate }
            )

            expect(screen.getByText(/page 3/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText(/row 201-300/i)).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).not.toBeDisabled()
            expect(nextButton).toBeDisabled()
        })

        it('shows correct pagination state for single page', () => {
            const singlePageData = {
                ...simpleLineList.responses,
                pager: {
                    page: 1,
                    pageSize: 100,
                    isLastPage: true,
                },
            }

            renderLineList(
                singlePageData as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                { onPaginate }
            )

            expect(screen.getByText(/page 1/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).toBeDisabled()
            expect(nextButton).toBeDisabled()
        })
    })

    describe('Legend visibility', () => {
        describe('Base case', () => {
            it('does not show legend when no legend sets are present', () => {
                const noLegendData = {
                    ...simpleLineList.responses,
                    headers: simpleLineList.responses.headers.map((header) => ({
                        ...header,
                        legendSet: undefined,
                    })),
                }

                renderLineList(
                    noLegendData as unknown as LineListAnalyticsData,
                    simpleLineList.visualization as unknown as CurrentVisualization
                )

                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()
            })
        })

        describe('Not in dashboard', () => {
            it('does not show legend key when showKey is false', () => {
                const visualization = {
                    ...largeLineListWithLegend.visualization,
                    legend: {
                        ...largeLineListWithLegend.visualization.legend,
                        showKey: false,
                    },
                }

                renderLineList(
                    largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                    visualization as unknown as CurrentVisualization,
                    { isInDashboard: false }
                )

                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()

                // Should not show legend toggle button when not in dashboard
                const legendToggle = screen.queryByTestId('legend-key-toggler')
                expect(legendToggle).not.toBeInTheDocument()
            })

            it('shows legend key when showKey is true', () => {
                const visualization = {
                    ...largeLineListWithLegend.visualization,
                    legend: {
                        ...largeLineListWithLegend.visualization.legend,
                        showKey: true,
                    },
                }

                renderLineList(
                    largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                    visualization as unknown as CurrentVisualization,
                    { isInDashboard: false }
                )

                expect(
                    screen.getByTestId('visualization-legend-key')
                ).toBeInTheDocument()

                // Should not show legend toggle button when not in dashboard
                const legendToggle = screen.queryByTestId('legend-key-toggler')
                expect(legendToggle).not.toBeInTheDocument()
            })
        })

        describe('In dashboard', () => {
            it('always shows component with toggle for showKey false', () => {
                const visualization = {
                    ...largeLineListWithLegend.visualization,
                    legend: {
                        ...largeLineListWithLegend.visualization.legend,
                        showKey: false,
                    },
                }

                renderLineList(
                    largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                    visualization as unknown as CurrentVisualization,
                    { isInDashboard: true }
                )

                // Should always show the legend toggle button in dashboard mode
                const legendToggle = screen.getByTestId('legend-key-toggler')
                expect(legendToggle).toBeInTheDocument()

                // Legend should be initially hidden when showKey is false
                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()
            })

            it('always shows component with toggle for showKey true', () => {
                const visualization = {
                    ...largeLineListWithLegend.visualization,
                    legend: {
                        ...largeLineListWithLegend.visualization.legend,
                        showKey: true,
                    },
                }

                renderLineList(
                    largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                    visualization as unknown as CurrentVisualization,
                    { isInDashboard: true }
                )

                // Should always show the legend toggle button in dashboard mode
                const legendToggle = screen.getByTestId('legend-key-toggler')
                expect(legendToggle).toBeInTheDocument()

                // Legend should be initially visible when showKey is true
                expect(
                    screen.getByTestId('visualization-legend-key')
                ).toBeInTheDocument()
            })

            it('for showKey false: legend key is initially hidden but can be shown by clicking', async () => {
                const user = userEvent.setup()

                const visualization = {
                    ...largeLineListWithLegend.visualization,
                    legend: {
                        ...largeLineListWithLegend.visualization.legend,
                        showKey: false,
                    },
                }

                renderLineList(
                    largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                    visualization as unknown as CurrentVisualization,
                    { isInDashboard: true }
                )

                // Legend should be initially hidden
                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()

                // Click the toggle button to show legend
                const legendToggle = screen.getByTestId('legend-key-toggler')
                await user.click(legendToggle)

                // Legend should now be visible
                expect(
                    screen.getByTestId('visualization-legend-key')
                ).toBeInTheDocument()
            })

            it('for showKey true: legend key is initially showing but can be hidden by clicking', async () => {
                const user = userEvent.setup()

                const visualization = {
                    ...largeLineListWithLegend.visualization,
                    legend: {
                        ...largeLineListWithLegend.visualization.legend,
                        showKey: true,
                    },
                }

                renderLineList(
                    largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                    visualization as unknown as CurrentVisualization,
                    { isInDashboard: true }
                )

                // Legend should be initially visible
                expect(
                    screen.getByTestId('visualization-legend-key')
                ).toBeInTheDocument()

                // Click the toggle button to hide legend
                const legendToggle = screen.getByTestId('legend-key-toggler')
                await user.click(legendToggle)

                // Legend should now be hidden
                // In dashboard mode, clicking the toggle conditionally renders/removes the legend from DOM
                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()
            })
        })
    })

    describe('Data cell styles with legend', () => {
        it('applies background color when legend style is FILL', () => {
            renderLineList(
                largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                largeLineListWithLegend.visualization as unknown as CurrentVisualization
            )

            // Get the first row's second cell (Weight in kg column) - use specific tbody selector
            const secondCell = screen
                .getByTestId('line-list-data-table-body')
                .querySelector('tr:first-child td:nth-child(2)')
            const innerDiv = secondCell?.querySelector('div')

            expect(secondCell).toBeInTheDocument()
            expect(innerDiv).toBeInTheDocument()

            // For FILL style, expect background color on cell and default text color on inner div
            const cellStyle = window.getComputedStyle(secondCell!)
            const divStyle = window.getComputedStyle(innerDiv!)
            expect(cellStyle.backgroundColor).toBe('rgb(33, 113, 181)')
            expect(divStyle.color).toBe('rgb(33, 41, 52)')
        })

        it('applies text color when legend style is TEXT', () => {
            const visualization = {
                ...largeLineListWithLegend.visualization,
                legend: {
                    ...largeLineListWithLegend.visualization.legend,
                    style: 'TEXT',
                },
            }

            renderLineList(
                largeLineListWithLegend.responses as unknown as LineListAnalyticsData,
                visualization as unknown as CurrentVisualization
            )

            // Get the first row's second cell (Weight in kg column) - use specific tbody selector
            const secondCell = screen
                .getByTestId('line-list-data-table-body')
                .querySelector('tr:first-child td:nth-child(2)')
            const innerDiv = secondCell?.querySelector('div')

            expect(secondCell).toBeInTheDocument()
            expect(innerDiv).toBeInTheDocument()

            // For TEXT style, expect background color on cell and text color on inner div
            const cellStyle = window.getComputedStyle(secondCell!)
            const divStyle = window.getComputedStyle(innerDiv!)
            expect(cellStyle.backgroundColor).toBe('rgb(255, 255, 255)')
            expect(divStyle.color).toBe('rgb(33, 113, 181)')
        })
    })

    describe('NoTimeDimension warning', () => {
        it('shows warning when isInModal is true and no time dimension present', () => {
            renderLineList(
                noTimeDimension.responses as unknown as LineListAnalyticsData,
                noTimeDimension.visualization as unknown as CurrentVisualization,
                { isInModal: true }
            )

            expect(
                screen.getByText(
                    /this line list may show data that was not available/i
                )
            ).toBeInTheDocument()
        })

        it('does not show warning when isInModal is false', () => {
            renderLineList(
                noTimeDimension.responses as unknown as LineListAnalyticsData,
                noTimeDimension.visualization as unknown as CurrentVisualization,
                { isInModal: false }
            )

            expect(
                screen.queryByText(
                    /this line list may show data that was not available/i
                )
            ).not.toBeInTheDocument()
        })

        it('does not show warning when isInModal is true but time dimension is present', () => {
            renderLineList(
                simpleLineList.responses as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                { isInModal: true }
            )

            expect(
                screen.queryByText(
                    /this line list may show data that was not available/i
                )
            ).not.toBeInTheDocument()
        })
    })

    describe('Disconnected behavior', () => {
        it('hides sorting functionality when connection is lost', () => {
            // Set disconnected state
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: false,
                isDisconnected: true,
            })

            renderLineList(
                simpleLineList.responses as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                {
                    onDataSort: vi.fn(),
                    onColumnHeaderClick: vi.fn(),
                }
            )

            const sortButtons = screen.queryAllByRole('button', {
                name: /sort by/i,
            })

            expect(sortButtons).toHaveLength(0)

            // Column headers should still be present
            expect(
                screen.getByRole('columnheader', { name: 'Organisation unit' })
            ).toBeInTheDocument()
            expect(
                screen.getByRole('columnheader', {
                    name: 'Enrollment date (e2e)',
                })
            ).toBeInTheDocument()
        })

        it('disables pagination when connection is lost', () => {
            // Set disconnected state
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: false,
                isDisconnected: true,
            })

            // Create modified analytics data with more items to test pagination
            const paginatedData = {
                ...simpleLineList.responses,
                paging: {
                    page: 1,
                    pageSize: 100,
                    total: 300, // More than one page to enable pagination controls
                },
            }

            renderLineList(
                paginatedData as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                {
                    onPaginate: vi.fn(),
                }
            )

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })
            const pageSizeSelect = screen.getByTestId(
                'dhis2-uicore-select-input'
            )

            expect(prevButton).toBeDisabled()
            expect(nextButton).toBeDisabled()
            expect(pageSizeSelect).toHaveClass('disabled')

            // Page size should show current value but be non-interactive
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText('Rows per page')).toBeInTheDocument()
        })

        it('shows tooltip on hover when pagination is disabled due to disconnection', async () => {
            const user = userEvent.setup()

            // Set disconnected state
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: false,
                isDisconnected: true,
            })

            // Create modified analytics data with more items to test pagination
            const paginatedData = {
                ...simpleLineList.responses,
                paging: {
                    page: 1,
                    pageSize: 100,
                    total: 300, // More than one page to enable pagination controls
                },
            }

            renderLineList(
                paginatedData as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                {
                    onPaginate: vi.fn(),
                }
            )

            // Find the sticky pagination container (which now has the tooltip props applied)
            const paginationContainer = screen.getByTestId(
                'sticky-pagination-container'
            )
            expect(paginationContainer).toBeInTheDocument()

            // Hover over the pagination container
            await user.hover(paginationContainer)

            // Wait for tooltip to appear and check if tooltip content appears
            await expect(
                screen.findByText('Not available offline')
            ).resolves.toBeInTheDocument()

            // Unhover to clean up
            await user.unhover(paginationContainer)
        })

        it('shows normal behavior when connection is restored', async () => {
            const user = userEvent.setup()

            // Start with disconnected state
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: false,
                isDisconnected: true,
            })

            const onDataSort = vi.fn()
            const onPaginate = vi.fn()

            const { rerender } = renderLineList(
                simpleLineList.responses as unknown as LineListAnalyticsData,
                simpleLineList.visualization as unknown as CurrentVisualization,
                {
                    onDataSort,
                    onPaginate,
                }
            )

            expect(
                screen.queryAllByRole('button', { name: /sort by/i })
            ).toHaveLength(0)

            // Restore connection
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: true,
                isDisconnected: false,
            })

            rerender(
                <LineList
                    analyticsData={
                        simpleLineList.responses as unknown as LineListAnalyticsData
                    }
                    visualization={
                        simpleLineList.visualization as unknown as CurrentVisualization
                    }
                    onDataSort={onDataSort}
                    onPaginate={onPaginate}
                    isFetching={false}
                    isInDashboard={false}
                    isInModal={false}
                />
            )

            const sortButton = screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })
            expect(sortButton).toBeInTheDocument()

            // Should be able to click it
            await user.click(sortButton)
            expect(onDataSort).toHaveBeenCalled()
        })
    })
})
