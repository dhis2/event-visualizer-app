import { useLoadVisualizationOnMount } from '@components/app/use-load-visualization-on-mount'
import {
    getLineListFixtureQueryData,
    loadLineListFixture,
} from '@components/line-list/__tests__/line-list-fixture-utils'
import { useLineListAnalyticsData } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { Analytics } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { transformVisualizationForAnalyticsRequest } from '@modules/analytics-request'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import { getCurrentVis } from '@store/current-vis-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { act, screen, waitFor } from '@testing-library/react'
import type { FC } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseAnalyticsTotalCounts = vi.hoisted(() => vi.fn(() => false))
vi.mock('@components/plugin-wrapper/hooks/use-analytics-total-counts', () => ({
    useAnalyticsTotalCounts: mockUseAnalyticsTotalCounts,
}))

const fixture = loadLineListFixture('e2e-enrollment')
const fixtureResponse = fixture.response as {
    rows: string[][]
    metaData: Record<string, unknown>
}

type AnalyticsParams = { page: number; pageSize: number; totalPages: boolean }
type AnalyticsHandler = (
    type: string,
    query: { params: AnalyticsParams }
) => unknown

const responseForPage = (page: number, rows = fixtureResponse.rows) => ({
    ...fixtureResponse,
    rows,
    metaData: {
        ...fixtureResponse.metaData,
        pager: { page, pageSize: 100, isLastPage: false },
    },
})

type HookResult = ReturnType<typeof useLineListAnalyticsData>
let hook: HookResult
let currentVis: ReturnType<typeof getCurrentVis>

const HookProbe: FC = () => {
    useLoadVisualizationOnMount()
    currentVis = useAppSelector(getCurrentVis)
    hook = useLineListAnalyticsData()
    return null
}

const renderHookProbe = async (analytics: AnalyticsHandler) => {
    const visualization = fixture.eventVisualization as { id: string }
    await renderWithAppWrapper(
        <ErrorBoundary
            fallbackRender={({ error }) => (
                <div data-test="error-boundary">{String(error)}</div>
            )}
        >
            <HookProbe />
        </ErrorBoundary>,
        {
            partialStore: {
                preloadedState: {
                    navigation: {
                        visualizationId: visualization.id,
                        interpretationId: null,
                    },
                },
            },
            queryData: getLineListFixtureQueryData(fixture, {
                analytics: analytics as never,
            }),
        }
    )
    await waitFor(() => expect(isVisualizationEmpty(currentVis)).toBe(false))
}

const fetchPage = (page: number) =>
    hook[0]({
        visualization: transformVisualizationForAnalyticsRequest(
            currentVis as Parameters<
                typeof transformVisualizationForAnalyticsRequest
            >[0]
        ),
        displayProperty: 'name',
        onResponseReceived: vi.fn(),
        page,
        pageSize: 100,
    })

describe('useLineListAnalyticsData', () => {
    beforeEach(() => {
        /* Analytics.getAnalytics caches a singleton bound to the first data
         * engine it sees; reset it so each test's mock data provider is used. */
        ;(
            Analytics.getAnalytics as unknown as { analytics?: unknown }
        ).analytics = undefined
    })

    it('requests totals when the server can count them', async () => {
        mockUseAnalyticsTotalCounts.mockReturnValue(true)
        const analytics = vi.fn<AnalyticsHandler>(() => responseForPage(1))
        await renderHookProbe(analytics)

        await act(() => fetchPage(1))

        expect(analytics.mock.calls.at(-1)![1].params.totalPages).toBe(true)
    })

    it('does not request totals otherwise', async () => {
        mockUseAnalyticsTotalCounts.mockReturnValue(false)
        const analytics = vi.fn<AnalyticsHandler>(() => responseForPage(1))
        await renderHookProbe(analytics)

        await act(() => fetchPage(1))

        expect(analytics.mock.calls.at(-1)![1].params.totalPages).toBe(false)
    })

    it('keeps the current page when a later page is empty', async () => {
        const analytics = vi.fn<AnalyticsHandler>((_, { params }) =>
            params.page === 1 ? responseForPage(1) : responseForPage(3, [])
        )
        await renderHookProbe(analytics)
        await act(() => fetchPage(1))
        const pagerBefore = hook[1].data!.pager

        await act(() => fetchPage(3))

        expect(hook[1].data!.rows).toEqual(fixtureResponse.rows)
        expect(hook[1].data!.pager).toEqual(pagerBefore)
        expect(hook[1].isFetching).toBe(false)
        expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
    })
})
