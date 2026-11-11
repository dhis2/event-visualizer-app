import {
    getLineListFixtureQueryData,
    loadLineListFixture,
} from '@components/line-list/__tests__/line-list-fixture-utils'
import { Analytics } from '@dhis2/analytics'
import { transformVisualizationForAnalyticsRequest } from '@modules/analytics-request'
import { normalizeApiSavedVisualization } from '@modules/visualization/normalize-legacy'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { waitFor } from '@testing-library/react'
import type { ApiSavedVisualization, CurrentVisualization } from '@types'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    collectLegendSetIdsToFetch,
    toLineListAnalyticsData,
    useLineListAnalyticsData,
    type LineListAnalyticsData,
    type LineListAnalyticsDataHeader,
    type LineListAnalyticsResponse,
    type LineListLegendSet,
} from './use-line-list-analytics-data'

const simpleLineList = loadLineListFixture('e2e-enrollment')
const largeLineListWithLegend = loadLineListFixture(
    'inpatient-extra-columns-and-legends'
)

/* The app-local visualization shape, derived the way the app's load pipeline
 * does it. */
const simpleLineListVis = normalizeApiSavedVisualization(
    simpleLineList.eventVisualization as unknown as ApiSavedVisualization
)
const largeLineListWithLegendVis = normalizeApiSavedVisualization(
    largeLineListWithLegend.eventVisualization as unknown as ApiSavedVisualization
)

describe('useLineListAnalyticsData', () => {
    beforeEach(() => {
        /* Analytics.getAnalytics caches a singleton bound to the first data
         * engine it sees; reset it so each test's mock data provider is used. */
        ;(
            Analytics.getAnalytics as unknown as { analytics?: unknown }
        ).analytics = undefined
    })

    it('fetches and assembles the analytics data and legend sets', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useLineListAnalyticsData(),
            {
                queryData: getLineListFixtureQueryData(largeLineListWithLegend),
            }
        )

        const [fetchAnalyticsData] = result.current
        await fetchAnalyticsData({
            visualization: transformVisualizationForAnalyticsRequest(
                largeLineListWithLegendVis as CurrentVisualization
            ),
            displayProperty: 'name',
            onResponseReceived: vi.fn(),
        })
        await waitFor(() => {
            expect(result.current[1].data).not.toBeNull()
        })

        const data = result.current[1].data!
        expect(data.rows).toEqual(
            (largeLineListWithLegend.response as { rows: unknown }).rows
        )
        expect(data.headers.map(({ dimensionId }) => dimensionId)).toContain(
            'Zj7UnCAulEk.vV9UWAZohSf'
        )
        expect(data.legendSets.map(({ id }) => id)).toEqual(['Yf6UHoPkdS6'])
    })
})

describe('toLineListAnalyticsData', () => {
    it('appends the canonical dimension ID to each header and flattens the response', () => {
        const response =
            simpleLineList.response as unknown as LineListAnalyticsResponse

        const analyticsData = toLineListAnalyticsData({
            response,
            visualization: simpleLineListVis as CurrentVisualization,
        })

        expect(
            analyticsData.headers.map(({ name, dimensionId }) => ({
                name,
                dimensionId,
            }))
        ).toEqual([
            { name: 'jfuXZB3A1ko.ouname', dimensionId: 'jfuXZB3A1ko.ou' },
            {
                name: 'enrollmentdate',
                dimensionId: 'J1QQtmzqhJz.enrollmentDate',
            },
        ])
        expect(analyticsData.rows).toBe(response.rows)
        expect(analyticsData.pager).toBe(response.metaData.pager)
        expect(analyticsData.metaDataItems).toBe(response.metaData.items)
        expect(analyticsData.legendSets).toEqual([])
    })

    it('prefixes data element headers with their stage and attaches the fetched legend sets', () => {
        const analyticsData = toLineListAnalyticsData({
            response:
                largeLineListWithLegend.response as unknown as LineListAnalyticsResponse,
            visualization: largeLineListWithLegendVis as CurrentVisualization,
            legendSets:
                largeLineListWithLegend.legendSets as unknown as LineListLegendSet[],
        })

        const weightHeader = analyticsData.headers.find(
            (header) => header.name === 'Zj7UnCAulEk.vV9UWAZohSf'
        )
        expect(weightHeader?.dimensionId).toBe('Zj7UnCAulEk.vV9UWAZohSf')
        expect(analyticsData.legendSets.map(({ id }) => id)).toEqual([
            'Yf6UHoPkdS6',
        ])
    })
})

const headers = [
    { name: 'ouname', dimensionId: 'ou', valueType: 'TEXT' },
    { name: 's1.weight', dimensionId: 's1.weight', valueType: 'NUMBER' },
    { name: 's1.height', dimensionId: 's1.height', valueType: 'NUMBER' },
] as LineListAnalyticsDataHeader[]

const metaDataItems = {
    's1.weight': { uid: 'weight', name: 'Weight', legendSet: 'ls1' },
    's1.height': { uid: 'height', name: 'Height', legendSet: 'ls2' },
} as unknown as LineListAnalyticsData['metaDataItems']

const buildVisualization = (legend: unknown): CurrentVisualization =>
    ({ outputType: 'EVENT', legend }) as unknown as CurrentVisualization

describe('collectLegendSetIdsToFetch', () => {
    it('returns the configured set for the FIXED strategy', () => {
        expect(
            collectLegendSetIdsToFetch(
                { headers, metaDataItems },
                buildVisualization({ strategy: 'FIXED', set: { id: 'ls1' } })
            )
        ).toEqual(['ls1'])
    })

    it('returns nothing for the FIXED strategy without a configured set', () => {
        expect(
            collectLegendSetIdsToFetch(
                { headers, metaDataItems },
                buildVisualization({ strategy: 'FIXED' })
            )
        ).toEqual([])
    })

    it('returns the legend sets of the data items for the BY_DATA_ITEM strategy', () => {
        expect(
            collectLegendSetIdsToFetch(
                { headers, metaDataItems },
                buildVisualization({ strategy: 'BY_DATA_ITEM' })
            )
        ).toEqual(['ls1', 'ls2'])
    })

    it('returns each legend set once for the BY_DATA_ITEM strategy', () => {
        expect(
            collectLegendSetIdsToFetch(
                {
                    headers,
                    metaDataItems: {
                        ...metaDataItems,
                        's1.height': { uid: 'height', legendSet: 'ls1' },
                    } as unknown as LineListAnalyticsData['metaDataItems'],
                },
                buildVisualization({ strategy: 'BY_DATA_ITEM' })
            )
        ).toEqual(['ls1'])
    })

    it('skips grouped columns for the BY_DATA_ITEM strategy', () => {
        const headersWithGroupedHeight = headers.map((header) =>
            header.name === 's1.height'
                ? { ...header, valueType: 'TEXT', legendSet: 'ls2' }
                : header
        ) as LineListAnalyticsDataHeader[]

        expect(
            collectLegendSetIdsToFetch(
                { headers: headersWithGroupedHeight, metaDataItems },
                buildVisualization({ strategy: 'BY_DATA_ITEM' })
            )
        ).toEqual(['ls1'])
    })

    it('skips columns without a legend set for the BY_DATA_ITEM strategy', () => {
        expect(
            collectLegendSetIdsToFetch(
                {
                    headers,
                    metaDataItems: {
                        's1.weight': metaDataItems['s1.weight'],
                    } as LineListAnalyticsData['metaDataItems'],
                },
                buildVisualization({ strategy: 'BY_DATA_ITEM' })
            )
        ).toEqual(['ls1'])
    })

    it('returns nothing when the visualization has no legend', () => {
        expect(
            collectLegendSetIdsToFetch(
                { headers, metaDataItems },
                buildVisualization(undefined)
            )
        ).toEqual([])
    })
})
