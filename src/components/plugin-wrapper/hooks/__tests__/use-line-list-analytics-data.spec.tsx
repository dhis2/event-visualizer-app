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

type ShownAlert = { message: string; options: unknown }
const shownAlerts = vi.hoisted(() => [] as ShownAlert[])
vi.mock('@dhis2/app-runtime', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useAlert: (
        message: string | ((props: unknown) => string),
        options?: unknown
    ) => ({
        show: (props: unknown) =>
            shownAlerts.push({
                message:
                    typeof message === 'function' ? message(props) : message,
                options,
            }),
        hide: vi.fn(),
    }),
}))

const fixture = loadLineListFixture('e2e-enrollment')
const fixtureResponse = fixture.response as {
    rows: string[][]
    metaData: Record<string, unknown>
}

type AnalyticsParams = { page: number; pageSize: number; totalPages: boolean }
type AnalyticsHandler = (
    type: string,
    query: { params: AnalyticsParams },
    options: { signal?: AbortSignal }
) => unknown

/* Holds back the response for each page until the test releases it. */
const createSlowAnalytics = () => {
    const pending = new Map<number, (response: unknown) => void>()
    const signals = new Map<number, AbortSignal | undefined>()
    const analytics = vi.fn<AnalyticsHandler>(
        (_, { params }, { signal }) =>
            new Promise((resolve) => {
                pending.set(params.page, resolve)
                signals.set(params.page, signal)
            })
    )
    const respond = (page: number) =>
        act(async () => pending.get(page)!(responseForPage(page)))
    return { analytics, respond, signals }
}

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

const fetchPagesWithoutWaiting = (...pages: number[]) =>
    act(() => {
        pages.forEach((page) => void fetchPage(page))
    })

describe('useLineListAnalyticsData', () => {
    beforeEach(() => {
        /* Analytics.getAnalytics caches a singleton bound to the first data
         * engine it sees; reset it so each test's mock data provider is used. */
        ;(
            Analytics.getAnalytics as unknown as { analytics?: unknown }
        ).analytics = undefined
        shownAlerts.length = 0
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

    it('tells the user when a later page is empty', async () => {
        const analytics = vi.fn<AnalyticsHandler>((_, { params }) =>
            params.page === 1 ? responseForPage(1) : responseForPage(9, [])
        )
        await renderHookProbe(analytics)
        await act(() => fetchPage(1))

        await act(() => fetchPage(9))

        expect(shownAlerts).toEqual([
            { message: 'Page 9 not found, returned to page 1', options: {} },
        ])
    })

    it('does not alert when the first page loads', async () => {
        const analytics = vi.fn<AnalyticsHandler>(() => responseForPage(1))
        await renderHookProbe(analytics)

        await act(() => fetchPage(1))

        expect(shownAlerts).toEqual([])
    })

    it('aborts the request for a page the user moved past', async () => {
        const { analytics, signals } = createSlowAnalytics()
        await renderHookProbe(analytics)

        fetchPagesWithoutWaiting(2, 3)

        await waitFor(() => expect(signals.has(3)).toBe(true))
        expect(signals.get(2)?.aborted).toBe(true)
        expect(signals.get(3)?.aborted).toBe(false)
    })

    it('shows the newest page when an older response arrives later', async () => {
        const { analytics, respond } = createSlowAnalytics()
        await renderHookProbe(analytics)

        fetchPagesWithoutWaiting(2, 3)
        await waitFor(() => expect(analytics).toHaveBeenCalledTimes(2))

        await respond(3)
        await waitFor(() => expect(hook[1].data?.pager.page).toBe(3))
        await respond(2)

        expect(hook[1].data!.pager.page).toBe(3)
        expect(hook[1].isFetching).toBe(false)
    })

    it('keeps loading until the newest request is answered', async () => {
        const { analytics, respond } = createSlowAnalytics()
        await renderHookProbe(analytics)

        fetchPagesWithoutWaiting(2, 3)
        await waitFor(() => expect(analytics).toHaveBeenCalledTimes(2))

        await respond(2)

        expect(hook[1].isFetching).toBe(true)
        expect(hook[1].data).toBeNull()
        expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
    })

    it('reports the page and page size of the newest request while loading', async () => {
        const { analytics } = createSlowAnalytics()
        await renderHookProbe(analytics)

        fetchPagesWithoutWaiting(2, 3)
        await waitFor(() => expect(analytics).toHaveBeenCalledTimes(2))

        expect(hook[1].pageRequest).toEqual({ page: 3, pageSize: 100 })
    })
})
