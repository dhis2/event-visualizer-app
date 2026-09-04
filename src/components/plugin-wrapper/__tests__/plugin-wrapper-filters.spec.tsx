import { useCurrentUser, useAppSelector } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { setNavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import analyticsResponse1 from '../__fixtures__/analytics-response-1.json'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { PluginWrapper } from '../plugin-wrapper'

/* Own file: Vitest isolates module state per file, avoiding cross-test
 * analytics-request pollution. */

const eventVisualization1Id = 'TIuOzZ0ID0V'

const TestHarness = () => {
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const [filters, setFilters] = useState<
        Record<'relativePeriodDate', string>
    >({ relativePeriodDate: '2024-01-01' })

    return (
        <>
            <button
                onClick={() => setFilters({ relativePeriodDate: '2024-06-01' })}
            >
                change filter
            </button>
            <PluginWrapper
                isVisualizationLoading={isVisualizationLoading}
                visualization={currentVis}
                filters={filters}
                displayProperty={currentUser.settings.displayProperty}
            />
        </>
    )
}

describe('PluginWrapper filter remount', () => {
    it('remounts the canvas (resetting page & sort) when relativePeriodDate changes', async () => {
        const user = userEvent.setup()
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

        const { store } = await renderWithAppWrapper(<TestHarness />, options)

        act(() => {
            store.dispatch(
                setNavigationState({ visualizationId: eventVisualization1Id })
            )
        })
        await deferred.releaseAll()
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })

        // Changing a filter must REMOUNT: the table is removed and the full
        // spinner shows. An in-place refetch would instead keep the table and
        // overlay the FetchOverlay on top of it.
        await user.click(screen.getByRole('button', { name: 'change filter' }))
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
        })

        // The refetch for the new filter brings the table back.
        await deferred.releaseAll()
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })
    })
})
