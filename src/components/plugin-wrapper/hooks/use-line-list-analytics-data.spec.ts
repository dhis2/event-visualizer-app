import simpleLineList from '@components/line-list/__fixtures__/e2e-enrollment.json'
import largeLineListWithLegend from '@components/line-list/__fixtures__/inpatient-cases-under-5-years-female-this-year-additional-columns-and-legends.json'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import {
    collectLegendSetIdsToFetch,
    toLineListAnalyticsData,
    type LineListAnalyticsDataHeader,
    type LineListAnalyticsResponse,
    type LineListLegendSet,
} from './use-line-list-analytics-data'

describe('toLineListAnalyticsData', () => {
    it('appends the canonical dimension ID to each header and flattens the response', () => {
        const response =
            simpleLineList.response as unknown as LineListAnalyticsResponse

        const analyticsData = toLineListAnalyticsData({
            response,
            visualization:
                simpleLineList.visualization as unknown as CurrentVisualization,
        })

        expect(
            analyticsData.headers.map(({ name, dimensionId }) => ({
                name,
                dimensionId,
            }))
        ).toEqual([
            { name: 'ouname', dimensionId: 'ou' },
            { name: 'enrollmentdate', dimensionId: 'enrollmentDate' },
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
            visualization:
                largeLineListWithLegend.visualization as unknown as CurrentVisualization,
            legendSets:
                largeLineListWithLegend.legendSets as unknown as LineListLegendSet[],
        })

        const weightHeader = analyticsData.headers.find(
            (header) => header.name === 'Zj7UnCAulEk.vV9UWAZohSf'
        )
        expect(weightHeader?.dimensionId).toBe('Zj7UnCAulEk.vV9UWAZohSf')
        expect(analyticsData.legendSets.map(({ id }) => id)).toEqual([
            'OrkEzxZEH4X',
            'Yf6UHoPkdS6',
        ])
    })
})

const headers = [
    { name: 'ouname', dimensionId: 'ou', valueType: 'TEXT' },
    { name: 's1.weight', dimensionId: 's1.weight', valueType: 'NUMBER' },
    { name: 's1.height', dimensionId: 's1.height', valueType: 'NUMBER' },
] as LineListAnalyticsDataHeader[]

const buildVisualization = (legend: unknown): CurrentVisualization =>
    ({ outputType: 'EVENT', legend }) as unknown as CurrentVisualization

describe('collectLegendSetIdsToFetch', () => {
    it('returns the configured set for the FIXED strategy', () => {
        expect(
            collectLegendSetIdsToFetch(
                headers,
                buildVisualization({ strategy: 'FIXED', set: { id: 'ls1' } }),
                createMetadataStoreStub()
            )
        ).toEqual(['ls1'])
    })

    it('returns nothing for the FIXED strategy without a configured set', () => {
        expect(
            collectLegendSetIdsToFetch(
                headers,
                buildVisualization({ strategy: 'FIXED' }),
                createMetadataStoreStub()
            )
        ).toEqual([])
    })

    it('returns the per-column sets from the metadata store for the BY_DATA_ITEM strategy', () => {
        const metadataStore = createMetadataStoreStub({
            dimensions: {
                's1.weight': { legendSetId: 'ls1' },
                's1.height': { legendSetId: 'ls2' },
            } as unknown as Record<string, DimensionMetadataItem>,
        })

        expect(
            collectLegendSetIdsToFetch(
                headers,
                buildVisualization({ strategy: 'BY_DATA_ITEM' }),
                metadataStore
            )
        ).toEqual(['ls1', 'ls2'])
    })

    it('skips columns without a legend set for the BY_DATA_ITEM strategy', () => {
        const metadataStore = createMetadataStoreStub({
            dimensions: {
                's1.weight': { legendSetId: 'ls1' },
            } as unknown as Record<string, DimensionMetadataItem>,
        })

        expect(
            collectLegendSetIdsToFetch(
                headers,
                buildVisualization({ strategy: 'BY_DATA_ITEM' }),
                metadataStore
            )
        ).toEqual(['ls1'])
    })

    it('returns nothing when the visualization has no legend', () => {
        expect(
            collectLegendSetIdsToFetch(
                headers,
                buildVisualization(undefined),
                createMetadataStoreStub()
            )
        ).toEqual([])
    })
})
