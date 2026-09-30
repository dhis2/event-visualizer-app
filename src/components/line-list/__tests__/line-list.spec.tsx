import { Analytics } from '@dhis2/analytics'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getLineListFixtureQueryData,
    loadLineListFixture,
    type LineListFixture,
} from './line-list-fixture-utils'
import { VisualizationTestHost } from './visualization-test-host'

const simpleLineList = loadLineListFixture('e2e-enrollment')
const largeLineListWithLegend = loadLineListFixture(
    'inpatient-extra-columns-and-legends'
)
const noTimeDimension = loadLineListFixture('no-time-dimension')

/* The connection status hook needs to be controllable to test offline
 * behavior; everything else comes from the real module, which the app
 * wrapper's providers need. */
const mockUseDhis2ConnectionStatus = vi.hoisted(() => vi.fn())
vi.mock('@dhis2/app-runtime', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useDhis2ConnectionStatus: mockUseDhis2ConnectionStatus,
}))

type QueryData = NonNullable<
    Parameters<typeof renderWithAppWrapper>[1]
>['queryData']
type CustomResource = NonNullable<QueryData>[string]
type AnalyticsResolver = ReturnType<
    typeof vi.fn<
        (type: string, query: { params: Record<string, unknown> }) => unknown
    >
>

type RenderLineListOptions = {
    eventVisualization?: Record<string, unknown>
    analytics?: CustomResource | AnalyticsResolver
    hostProps?: ComponentProps<typeof VisualizationTestHost>
}

const renderLineList = async (
    fixture: LineListFixture,
    { eventVisualization, analytics, hostProps }: RenderLineListOptions = {}
) => {
    const visualizationPayload =
        eventVisualization ??
        (fixture.eventVisualization as Record<string, unknown>)
    const view = await renderWithAppWrapper(
        <VisualizationTestHost {...hostProps} />,
        {
            partialStore: {
                preloadedState: {
                    navigation: {
                        visualizationId: visualizationPayload.id as string,
                        interpretationId: null,
                    },
                },
            },
            queryData: getLineListFixtureQueryData(fixture, {
                eventVisualizations: visualizationPayload as CustomResource,
                ...(analytics
                    ? { analytics: analytics as CustomResource }
                    : {}),
            }),
        }
    )
    await screen.findByTestId('line-list-data-table')
    return view
}

const withLegend = (fixture: LineListFixture, legend: object) => {
    const visualizationPayload = fixture.eventVisualization as Record<
        string,
        unknown
    > & { legend: object }
    return {
        ...visualizationPayload,
        legend: { ...visualizationPayload.legend, ...legend },
    }
}

const analyticsWithPager = (fixture: LineListFixture, pager: object) => {
    const response = fixture.response as { metaData: Record<string, unknown> }
    return {
        ...response,
        metaData: { ...response.metaData, pager },
    } as unknown as CustomResource
}

const createAnalyticsSpy = (response: unknown): AnalyticsResolver => {
    const resolve: (
        type: string,
        query: { params: Record<string, unknown> }
    ) => unknown = () => response
    return vi.fn(resolve)
}

const getLastAnalyticsParams = (analyticsSpy: AnalyticsResolver) =>
    analyticsSpy.mock.calls.at(-1)![1].params

describe('LineList', () => {
    beforeEach(() => {
        mockUseDhis2ConnectionStatus.mockReturnValue({ isDisconnected: false })
        /* Analytics.getAnalytics caches a singleton bound to the first data
         * engine it sees; reset it so each test's mock data provider is used. */
        ;(
            Analytics.getAnalytics as unknown as { analytics?: unknown }
        ).analytics = undefined
    })

    describe('Snapshot test', () => {
        it('renders large table with legend set correctly', async () => {
            const { container } = await renderLineList(largeLineListWithLegend)
            expect(container).toMatchSnapshot()
        })
    })

    describe('Sorting', () => {
        it('refetches with the sort parameters when a sort icon is clicked', async () => {
            const user = userEvent.setup()
            const analyticsSpy = createAnalyticsSpy(simpleLineList.response)

            await renderLineList(simpleLineList, { analytics: analyticsSpy })
            expect(analyticsSpy).toHaveBeenCalledTimes(1)

            const sortButton = screen.getByRole('button', {
                name: /sort by.*event org\. unit/i,
            })
            await user.click(sortButton)

            await waitFor(() => {
                expect(analyticsSpy).toHaveBeenCalledTimes(2)
            })
            expect(getLastAnalyticsParams(analyticsSpy).asc).toBe(
                'jfuXZB3A1ko.ouname'
            )
        })

        it('calls onColumnHeaderClick when column header text is clicked', async () => {
            const user = userEvent.setup()
            const onColumnHeaderClick = vi.fn()

            await renderLineList(simpleLineList, {
                hostProps: { onColumnHeaderClick },
            })

            // Find the column header text (not the sort button)
            const headerText = screen.getByText('Event org. unit')
            await user.click(headerText)

            expect(onColumnHeaderClick).toHaveBeenCalledWith('jfuXZB3A1ko.ou')
        })

        /* More in-depth tests reg. sort directions etc are found in
         * `header-cell.spec.tsx` */
    })

    describe('Pagination', () => {
        it('refetches the next page when page is changed', async () => {
            const user = userEvent.setup()
            const analyticsSpy = createAnalyticsSpy(
                analyticsWithPager(largeLineListWithLegend, {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                })
            )

            await renderLineList(largeLineListWithLegend, {
                analytics: analyticsSpy,
            })

            const nextButton = screen.getByRole('button', { name: 'Next' })
            await user.click(nextButton)

            await waitFor(() => {
                expect(analyticsSpy).toHaveBeenCalledTimes(2)
            })
            expect(getLastAnalyticsParams(analyticsSpy).page).toBe(2)
        })

        it('refetches with the new page size when page size is changed', async () => {
            const user = userEvent.setup()
            const analyticsSpy = createAnalyticsSpy(
                analyticsWithPager(largeLineListWithLegend, {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                })
            )

            await renderLineList(largeLineListWithLegend, {
                analytics: analyticsSpy,
            })

            // Find the page size select dropdown
            const pageSizeSelect = screen.getByTestId(
                'dhis2-uicore-select-input'
            )

            // Click to open the dropdown
            await user.click(pageSizeSelect)

            // Find and click on the "50" option within the options container
            const option50 = within(
                screen.getByTestId('dhis2-uicore-select-menu-menuwrapper')
            ).getByText('50')
            await user.click(option50)

            await waitFor(() => {
                expect(analyticsSpy).toHaveBeenCalledTimes(2)
            })
            expect(getLastAnalyticsParams(analyticsSpy)).toMatchObject({
                page: 1,
                pageSize: 50,
            })
        })

        it('displays pagination information correctly', async () => {
            await renderLineList(largeLineListWithLegend)

            // Verify the correct page size is displayed (default 100 from fixture)
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText(/rows per page/i)).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).toBeDisabled()
            expect(nextButton).not.toBeDisabled()

            expect(screen.getByText(/page 1, row 1-100/i)).toBeInTheDocument()
        })

        it('shows correct pagination state for first page', async () => {
            await renderLineList(simpleLineList, {
                analytics: analyticsWithPager(simpleLineList, {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                }),
            })

            expect(screen.getByText(/page 1/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).toBeDisabled()
            expect(nextButton).not.toBeDisabled()
        })

        it('shows correct pagination state for middle page', async () => {
            await renderLineList(largeLineListWithLegend, {
                analytics: analyticsWithPager(largeLineListWithLegend, {
                    page: 2,
                    pageSize: 100,
                    isLastPage: false,
                }),
            })

            expect(screen.getByText(/page 2/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText(/row 101-200/i)).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).not.toBeDisabled()
            expect(nextButton).not.toBeDisabled()
        })

        it('shows correct pagination state for last page', async () => {
            await renderLineList(largeLineListWithLegend, {
                analytics: analyticsWithPager(largeLineListWithLegend, {
                    page: 3,
                    pageSize: 100,
                    isLastPage: true,
                }),
            })

            expect(screen.getByText(/page 3/i)).toBeInTheDocument()
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText(/row 201-300/i)).toBeInTheDocument()

            const prevButton = screen.getByRole('button', { name: 'Previous' })
            const nextButton = screen.getByRole('button', { name: 'Next' })

            expect(prevButton).not.toBeDisabled()
            expect(nextButton).toBeDisabled()
        })

        it('shows correct pagination state for single page', async () => {
            await renderLineList(simpleLineList, {
                analytics: analyticsWithPager(simpleLineList, {
                    page: 1,
                    pageSize: 100,
                    isLastPage: true,
                }),
            })

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
            it('does not show legend when no legend sets are present', async () => {
                await renderLineList(simpleLineList)

                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()
            })
        })

        describe('Not in dashboard', () => {
            it('does not show legend key when showKey is false', async () => {
                await renderLineList(largeLineListWithLegend, {
                    eventVisualization: withLegend(largeLineListWithLegend, {
                        showKey: false,
                    }),
                })

                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()

                // Should not show legend toggle button when not in dashboard
                const legendToggle = screen.queryByTestId('legend-key-toggler')
                expect(legendToggle).not.toBeInTheDocument()
            })

            it('shows legend key when showKey is true', async () => {
                await renderLineList(largeLineListWithLegend, {
                    eventVisualization: withLegend(largeLineListWithLegend, {
                        showKey: true,
                    }),
                })

                expect(
                    screen.getByTestId('visualization-legend-key')
                ).toBeInTheDocument()

                // Should not show legend toggle button when not in dashboard
                const legendToggle = screen.queryByTestId('legend-key-toggler')
                expect(legendToggle).not.toBeInTheDocument()
            })
        })

        describe('In dashboard', () => {
            it('always shows component with toggle for showKey false', async () => {
                await renderLineList(largeLineListWithLegend, {
                    eventVisualization: withLegend(largeLineListWithLegend, {
                        showKey: false,
                    }),
                    hostProps: { isInDashboard: true },
                })

                // Should always show the legend toggle button in dashboard mode
                const legendToggle = screen.getByTestId('legend-key-toggler')
                expect(legendToggle).toBeInTheDocument()

                // Legend should be initially hidden when showKey is false
                expect(
                    screen.queryByTestId('visualization-legend-key')
                ).not.toBeInTheDocument()
            })

            it('always shows component with toggle for showKey true', async () => {
                await renderLineList(largeLineListWithLegend, {
                    eventVisualization: withLegend(largeLineListWithLegend, {
                        showKey: true,
                    }),
                    hostProps: { isInDashboard: true },
                })

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

                await renderLineList(largeLineListWithLegend, {
                    eventVisualization: withLegend(largeLineListWithLegend, {
                        showKey: false,
                    }),
                    hostProps: { isInDashboard: true },
                })

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

                await renderLineList(largeLineListWithLegend, {
                    eventVisualization: withLegend(largeLineListWithLegend, {
                        showKey: true,
                    }),
                    hostProps: { isInDashboard: true },
                })

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
        it('applies background color when legend style is FILL', async () => {
            await renderLineList(largeLineListWithLegend)

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
            expect(cellStyle.backgroundColor).toBe('rgb(158, 202, 225)')
            expect(divStyle.color).toBe('rgb(33, 41, 52)')
        })

        it('applies text color when legend style is TEXT', async () => {
            await renderLineList(largeLineListWithLegend, {
                eventVisualization: withLegend(largeLineListWithLegend, {
                    style: 'TEXT',
                }),
            })

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
            expect(divStyle.color).toBe('rgb(158, 202, 225)')
        })
    })

    describe('NoTimeDimension warning', () => {
        it('shows warning when isInModal is true and no time dimension present', async () => {
            await renderLineList(noTimeDimension, {
                hostProps: { isInModal: true },
            })

            expect(
                screen.getByText(
                    /this line list may show data that was not available/i
                )
            ).toBeInTheDocument()
        })

        it('does not show warning when isInModal is false', async () => {
            await renderLineList(noTimeDimension, {
                hostProps: { isInModal: false },
            })

            expect(
                screen.queryByText(
                    /this line list may show data that was not available/i
                )
            ).not.toBeInTheDocument()
        })

        it('does not show warning when isInModal is true but time dimension is present', async () => {
            await renderLineList(simpleLineList, {
                hostProps: { isInModal: true },
            })

            expect(
                screen.queryByText(
                    /this line list may show data that was not available/i
                )
            ).not.toBeInTheDocument()
        })
    })

    describe('Disconnected behavior', () => {
        it('hides sorting functionality when connection is lost', async () => {
            // Set disconnected state
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: false,
                isDisconnected: true,
            })

            await renderLineList(simpleLineList)

            const sortButtons = screen.queryAllByRole('button', {
                name: /sort by/i,
            })

            expect(sortButtons).toHaveLength(0)

            // Column headers should still be present
            expect(
                screen.getByRole('columnheader', { name: 'Event org. unit' })
            ).toBeInTheDocument()
            expect(
                screen.getByRole('columnheader', {
                    name: 'Enrollment date (e2e)',
                })
            ).toBeInTheDocument()
        })

        it('disables pagination when connection is lost', async () => {
            // Set disconnected state
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: false,
                isDisconnected: true,
            })

            await renderLineList(simpleLineList, {
                analytics: analyticsWithPager(simpleLineList, {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                }),
            })

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

            await renderLineList(simpleLineList, {
                analytics: analyticsWithPager(simpleLineList, {
                    page: 1,
                    pageSize: 100,
                    isLastPage: false,
                }),
            })

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

            const { rerender } = await renderLineList(simpleLineList)

            expect(
                screen.queryAllByRole('button', { name: /sort by/i })
            ).toHaveLength(0)

            // Restore connection
            mockUseDhis2ConnectionStatus.mockReturnValue({
                isConnected: true,
                isDisconnected: false,
            })

            rerender(<VisualizationTestHost />)

            const sortButton = await screen.findByRole('button', {
                name: /sort by.*event org\. unit/i,
            })
            expect(sortButton).toBeInTheDocument()

            // Should be able to click it
            await user.click(sortButton)
        })
    })
})
