//import { FetchError } from '@dhis2/app-runtime'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import analyticsResponse1 from '../__fixtures__/analytics-response-1.json'
import analyticsResponse2 from '../__fixtures__/analytics-response-2.json'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import eventVisualization2 from '../__fixtures__/inpatient-visit-overview-this-year-bonthe.json'
import { PluginWrapper } from '../plugin-wrapper'
import { useCurrentUser, useAppSelector } from '@hooks'
import { setNavigationState } from '@store/navigation-slice'
import type { RootState } from '@store/store'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'

describe('PluginWrapper', () => {
    const TestComponent = () => {
        const currentUser = useCurrentUser()
        const isVisualizationLoading = useAppSelector(
            (state: RootState) => state.loader.isVisualizationLoading
        )
        const currentVis = useAppSelector(
            (state: RootState) => state.currentVis
        )

        // TODO: mock these?
        const onDataSorted = () => {}
        const onResponseReceived = () => {}

        return (
            <PluginWrapper
                isVisualizationLoading={isVisualizationLoading}
                visualization={currentVis}
                displayProperty={currentUser.settings.displayProperty}
                onDataSorted={onDataSorted}
                onResponseReceived={onResponseReceived}
            />
        )
    }

    it.only('should render the loading spinner while loading and switching visualizations', async () => {
        const eventVisualization1Id = 'TIuOzZ0ID0V'
        const eventVisualization2Id = 'waPjzoJyIQ9'

        const { store } = await renderWithAppWrapper(<TestComponent />, {
            queryData: {
                analytics: async (_, query) => {
                    console.log('analytics query', query)
                    await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay to mimic async
                    if (
                        query.params.dimension.includes(
                            'qrur9Dvnyt5:GE:5:LE:10'
                        )
                    ) {
                        return analyticsResponse1
                    } else {
                        return analyticsResponse2
                    }
                },
                // mock the POST to dataStatistics done in the eventVisualization endpoint
                dataStatistics: {},
                eventVisualizations: async (_, query) => {
                    console.log('eventVisualization query', query.id)
                    await new Promise((resolve) => setTimeout(resolve, 100)) // Shorter delay
                    if (query.id === eventVisualization1Id) {
                        return eventVisualization1
                    } else if (query.id === eventVisualization2Id) {
                        return eventVisualization2
                    }
                },
            } as unknown,
        } as MockOptions)

        // navigate to the 1st visualization
        act(() => {
            store.dispatch(
                setNavigationState({
                    visualizationId: eventVisualization1Id,
                })
            )
        })

        await screen.findByTestId('dhis2-uicore-circularloader')
        expect(store.getState().loader.isVisualizationLoading).toBe(true)
        expect(
            screen.queryByTestId('line-list-data-table')
        ).not.toBeInTheDocument()

        await waitFor(() => {
            expect(store.getState().currentVis.id).toBe(eventVisualization1Id)
            expect(store.getState().loader.isVisualizationLoading).toBe(false)
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
        })

        await waitFor(() => {
            expect(
                screen.queryByTestId('line-list-data-table')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).not.toBeInTheDocument()
        })

        // Switch to second visualization
        act(() => {
            store.dispatch(
                setNavigationState({ visualizationId: eventVisualization2Id })
            )
        })

        expect(store.getState().loader.isVisualizationLoading).toBe(true)
        await screen.findByTestId('dhis2-uicore-circularloader')
        expect(
            screen.queryByTestId('line-list-data-table')
        ).not.toBeInTheDocument()

        await waitFor(() => {
            expect(store.getState().currentVis.id).toBe(eventVisualization2Id)
            expect(store.getState().loader.isVisualizationLoading).toBe(false)
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
        })

        await waitFor(() => {
            expect(
                screen.queryByTestId('line-list-data-table')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('dhis2-uicore-circularloader')
            ).not.toBeInTheDocument()
        })
    })

    it('should render the table and the loading spinner when paginating or sorting', async () => {
        const user = userEvent.setup()

        const eventVisualization2Id = 'waPjzoJyIQ9'

        const { store } = await renderWithAppWrapper(<TestComponent />, {
            queryData: {
                analytics: analyticsResponse2,
                // mock the POST to dataStatistics done in the eventVisualization endpoint
                dataStatistics: {},
                eventVisualizations: eventVisualization2,
            } as unknown,
        } as MockOptions)

        // navigate to the 2nd visualization
        store.dispatch(
            setNavigationState({
                visualizationId: eventVisualization2Id,
            })
        )

        await waitFor(() => {
            // the table is visible
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })

        // simulate pagination
        await user.click(screen.getByRole('button', { name: 'Next' }))

        console.log('after user click')

        // the table is still visible
        expect(screen.getByTestId('line-list-data-table')).toBeInTheDocument()

        // XXX: here the spinner is gone already and the waitFor below fails which means the spinner is never shown again after this point
        screen.debug()

        //        await waitFor(() => {
        //            // the spinner is also visible
        //            expect(
        //                screen.getByTestId('dhis2-uicore-circularloader')
        //            ).toBeInTheDocument()
        //        })
    })
})
