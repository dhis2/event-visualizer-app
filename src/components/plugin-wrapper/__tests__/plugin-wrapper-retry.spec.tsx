import { FetchError } from '@dhis2/app-runtime'
import { useCurrentUser, useAppSelector } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { setNavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { suppressWindowError } from '@test-utils/suppress-window-error'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import analyticsResponse1 from '../__fixtures__/analytics-response-1.json'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { PluginWrapper } from '../plugin-wrapper'

/* Own file: Vitest isolates module state per file, avoiding the cross-test
 * analytics-request pollution that makes this hang in a shared spec. */

const eventVisualization1Id = 'TIuOzZ0ID0V'

const TestComponent = () => {
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return (
        <PluginWrapper
            isVisualizationLoading={isVisualizationLoading}
            visualization={currentVis}
            displayProperty={currentUser.settings.displayProperty}
        />
    )
}

describe('PluginWrapper canvas error retry', () => {
    /* A failing refetch (paging here) happens while hasAnalyticsData is already
     * true. The canvas error replaces the table; Retry must re-arm the spinner
     * rather than leave a blank canvas while the retry is in flight. */
    it(
        'shows the spinner, not a blank canvas, when retrying after a failed refetch',
        suppressWindowError('boom', async () => {
            const user = userEvent.setup()
            let analyticsShouldFail = false
            const deferred = createDeferredQuery()
            const options = {
                queryData: {
                    analytics: deferred.defer(() => {
                        if (analyticsShouldFail) {
                            throw new FetchError({
                                type: 'network',
                                message: 'boom',
                            })
                        }
                        return analyticsResponse1
                    }),
                    dataStatistics: {},
                    eventVisualizations: async (
                        _: unknown,
                        query: { id?: string }
                    ) =>
                        query.id === eventVisualization1Id
                            ? eventVisualization1
                            : undefined,
                } as unknown,
            } as MockOptions

            const { store } = await renderWithAppWrapper(
                <TestComponent />,
                options
            )

            // Load the visualization and its first (successful) analytics response.
            act(() => {
                store.dispatch(
                    setNavigationState({
                        visualizationId: eventVisualization1Id,
                    })
                )
            })
            await deferred.releaseAll()
            await waitFor(() => {
                expect(
                    screen.getByTestId('line-list-data-table')
                ).toBeInTheDocument()
            })

            // A paging refetch that fails: the canvas error replaces the table.
            analyticsShouldFail = true
            await user.click(screen.getByRole('button', { name: 'Next' }))
            await deferred.releaseAll()
            await waitFor(() => {
                expect(
                    screen.getByText('Something went wrong')
                ).toBeInTheDocument()
                expect(
                    screen.queryByTestId('line-list-data-table')
                ).not.toBeInTheDocument()
            })

            // Retry: the retried request is still in flight (deferred). The spinner
            // must show — not a blank canvas — because onReset re-armed
            // hasAnalyticsData.
            analyticsShouldFail = false
            await user.click(screen.getByRole('button', { name: 'Retry' }))
            await waitFor(() => {
                expect(
                    screen.getByTestId('dhis2-uicore-circularloader')
                ).toBeInTheDocument()
            })
            expect(
                screen.queryByText('Something went wrong')
            ).not.toBeInTheDocument()

            // Releasing the retried request brings the table back.
            await deferred.releaseAll()
            await waitFor(() => {
                expect(
                    screen.getByTestId('line-list-data-table')
                ).toBeInTheDocument()
                expect(
                    screen.queryByTestId('dhis2-uicore-circularloader')
                ).not.toBeInTheDocument()
            })
        })
    )
})
