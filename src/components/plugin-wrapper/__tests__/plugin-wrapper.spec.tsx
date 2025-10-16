import type { Store } from '@reduxjs/toolkit'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import analyticsResponse1 from '../__fixtures__/analytics-response-1.json'
import analyticsResponse2 from '../__fixtures__/analytics-response-2.json'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import eventVisualization2 from '../__fixtures__/inpatient-visit-overview-this-year-bonthe.json'
import { PluginWrapper } from '../plugin-wrapper'
import { useCurrentUser, useAppSelector, useAppDispatch } from '@hooks'
import { getCurrentVis, setCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { setNavigationState } from '@store/navigation-slice'
import type { RootState } from '@store/store'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import type { CurrentVisualization, Sorting } from '@types'

describe('PluginWrapper', () => {
    const eventVisualization1Id = 'TIuOzZ0ID0V'
    const eventVisualization2Id = 'waPjzoJyIQ9'
    const mockOnDataSorted = vi.fn()
    const mockOnResponseReceived = vi.fn()
    const mockOptions = {
        queryData: {
            analytics: async (_, query) => {
                await new Promise((resolve) => setTimeout(resolve, 200)) // For this follow-up request
                if (query.params.dimension.includes('qrur9Dvnyt5:GE:5:LE:10')) {
                    return analyticsResponse1
                } else {
                    return analyticsResponse2
                }
            },
            // mock the POST to dataStatistics done in the eventVisualization endpoint
            dataStatistics: {},
            eventVisualizations: async (_, query) => {
                if (query.id === eventVisualization1Id) {
                    return eventVisualization1
                } else if (query.id === eventVisualization2Id) {
                    return eventVisualization2
                }
            },
        } as unknown,
    } as MockOptions
    const TestComponent = () => {
        const dispatch = useAppDispatch()
        const currentUser = useCurrentUser()
        const currentVis = useAppSelector(getCurrentVis)
        const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
        mockOnDataSorted.mockImplementation((sorting: Sorting) => {
            dispatch(
                setCurrentVis({
                    ...currentVis,
                    sorting: sorting ? [sorting] : undefined,
                } as CurrentVisualization)
            )
        })

        return (
            <PluginWrapper
                isVisualizationLoading={isVisualizationLoading}
                visualization={currentVis}
                displayProperty={currentUser.settings.displayProperty}
                onDataSorted={mockOnDataSorted}
                onResponseReceived={mockOnResponseReceived}
            />
        )
    }

    const loadFirstVisualization = async (store: Store<RootState>) => {
        // navigate to the 1st visualization
        act(() => {
            store.dispatch(
                setNavigationState({
                    visualizationId: eventVisualization1Id,
                })
            )
        })

        // Loading state switched to true
        await waitFor(() => {
            expect(store.getState().loader.isVisualizationLoading).toBe(true)
        })

        // Table is removed from the DOM and the spinner is showing
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
        })

        // First vis is in the state and loading state is false
        await waitFor(() => {
            expect(store.getState().currentVis.id).toBe(eventVisualization1Id)
            expect(store.getState().loader.isVisualizationLoading).toBe(false)
        })

        // Table is not showing yet because analytics data is fetching and loader is showing
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
        })

        // When analytics data comes in, the loader is removed and the table shows
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).not.toBeInTheDocument()
            expect(mockOnResponseReceived).toBeCalledTimes(1)
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render the loading spinner while loading and switching visualizations', async () => {
        const { store } = await renderWithAppWrapper(
            <TestComponent />,
            mockOptions
        )

        await loadFirstVisualization(store)

        // Switch to second visualization
        act(() => {
            store.dispatch(
                setNavigationState({ visualizationId: eventVisualization2Id })
            )
        })

        // Loading state switched to true
        await waitFor(() => {
            expect(store.getState().loader.isVisualizationLoading).toBe(true)
        })

        // Table is removed from the DOM and the spinner is showing
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
        })

        // Second vis is in the state and loading state is false
        await waitFor(() => {
            expect(store.getState().currentVis.id).toBe(eventVisualization2Id)
            expect(store.getState().loader.isVisualizationLoading).toBe(false)
        })

        // Table is not showing yet because analytics data is fetching and loader is showing
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
        })

        // When analytics data comes in, the loader is removed and the table shows
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).not.toBeInTheDocument()
            expect(mockOnResponseReceived).toBeCalledTimes(2)
        })
    })

    it('should render the table and the loading spinner when paginating', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <TestComponent />,
            mockOptions
        )

        await loadFirstVisualization(store)

        // simulate pagination
        await user.click(screen.getByRole('button', { name: 'Next' }))

        // Visualisation loading state remains false and current vis remains the same
        await waitFor(() => {
            expect(store.getState().loader.isVisualizationLoading).toBe(false)
            expect(store.getState().currentVis.id).toBe(eventVisualization1Id)
        })

        // Table kept in the DOM and the spinner is showing
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })

        // When analytics data comes in, the loader is removed and the table still shows
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).not.toBeInTheDocument()
            expect(mockOnResponseReceived).toBeCalledTimes(2)
        })
    })

    it('should render the table and the loading spinner when sorting', async () => {
        const user = userEvent.setup()
        const { store } = await renderWithAppWrapper(
            <TestComponent />,
            mockOptions
        )

        await loadFirstVisualization(store)

        const currentVisSnapshot = store.getState().currentVis

        // Sorting
        await user.click(
            screen.getByRole('button', {
                name: /sort by.*organisation unit/i,
            })
        )

        // Visualisation loading state remains false but the current vis gets updated
        await waitFor(() => {
            expect(store.getState().loader.isVisualizationLoading).toBe(false)
            expect(store.getState().currentVis === currentVisSnapshot).toBe(
                false
            )
        })

        // Table kept in the DOM and the spinner is showing
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })

        // When analytics data comes in, the loader is removed and the table still shows
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).not.toBeInTheDocument()
            expect(mockOnResponseReceived).toBeCalledTimes(2)
            expect(mockOnDataSorted).toBeCalledTimes(1)
        })
    })
})
