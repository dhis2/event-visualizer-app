import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import {
    collectLegendSetIdsToFetch,
    type LineListAnalyticsDataHeader,
} from './use-line-list-analytics-data'

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
