import { useCurrentUser, useAppSelector } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { setNavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { HostFilters } from '@types'
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import analyticsResponse1 from '../__fixtures__/analytics-response-1.json'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { PluginWrapper } from '../plugin-wrapper'

/* Own file, same reason as plugin-wrapper-filters.spec.tsx: @dhis2/analytics'
 * Analytics.getAnalytics() is a hard singleton keyed on the first dataEngine
 * it ever sees, so a second test in the same file would route its analytics
 * requests through the first test's (already-torn-down) mock provider. */

const eventVisualization1Id = 'TIuOzZ0ID0V'

const OrgUnitHarness = () => {
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const [filters, setFilters] = useState<HostFilters>({
        ou: [{ id: 'ImspTQPwCqd', name: 'Sierra Leone' }],
    })

    return (
        <>
            <button
                onClick={() =>
                    setFilters({ ou: [{ id: 'O6uvpzGd5pu', name: 'Bo' }] })
                }
            >
                change org unit
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

describe('PluginWrapper filter remount (org unit)', () => {
    it('remounts the canvas when a dashboard org unit filter changes', async () => {
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

        const { store } = await renderWithAppWrapper(
            <OrgUnitHarness />,
            options
        )

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

        await user.click(
            screen.getByRole('button', { name: 'change org unit' })
        )
        await waitFor(() => {
            expect(
                screen.getByTestId('dhis2-uicore-circularloader')
            ).toBeInTheDocument()
            expect(
                screen.queryByTestId('line-list-data-table')
            ).not.toBeInTheDocument()
        })

        await deferred.releaseAll()
        await waitFor(() => {
            expect(
                screen.getByTestId('line-list-data-table')
            ).toBeInTheDocument()
        })
    })
})
