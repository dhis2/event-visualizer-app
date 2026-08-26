import { useCurrentUser, useAppSelector } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { setNavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { act, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import analyticsResponse1 from '../__fixtures__/analytics-response-1.json'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { PluginWrapper } from '../plugin-wrapper'

/* Own file: @dhis2/analytics' Analytics.getAnalytics() is a singleton keyed on
 * the first dataEngine it sees, so a second analytics test here would use the
 * first's torn-down mock. */

const eventVisualization1Id = 'TIuOzZ0ID0V'

const UnappliedFilterHarness = () => {
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return (
        <PluginWrapper
            isVisualizationLoading={isVisualizationLoading}
            visualization={currentVis}
            filters={{ ou: [{ id: 'ImspTQPwCqd', name: 'Sierra Leone' }] }}
            displayProperty={currentUser.settings.displayProperty}
        />
    )
}

describe('PluginWrapper loading state with an unapplied filter', () => {
    it('keeps the loading spinner perceivable instead of covering it with the filters notice', async () => {
        const deferred = createDeferredQuery()
        const options = {
            queryData: {
                analytics: deferred.defer(() => analyticsResponse1),
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
            <UnappliedFilterHarness />,
            options
        )

        act(() => {
            store.dispatch(
                setNavigationState({ visualizationId: eventVisualization1Id })
            )
        })

        // While the analytics response is still pending, the spinner must be
        // visible and not covered by the filters-not-applied notice.
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
        })
        expect(
            screen.queryByTestId('filters-not-applied-notice')
        ).not.toBeInTheDocument()

        // Once the data arrives, the notice must reappear: it was only
        // suppressed for the load, not dismissed.
        await deferred.releaseAll()
        await waitFor(() => {
            expect(
                screen.getByTestId('filters-not-applied-notice')
            ).toBeInTheDocument()
        })
        expect(
            screen.queryByTestId('dhis2-uicore-circularloader')
        ).not.toBeInTheDocument()
    })
})
