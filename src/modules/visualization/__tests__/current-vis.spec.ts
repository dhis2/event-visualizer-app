import { DEFAULT_OPTIONS } from '@constants/options'
import { buildCurrentVisFromVisUiConfig } from '@modules/visualization/current-vis'
import { getVisualizationUiConfig } from '@modules/visualization/ui-config'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type {
    AggregationType,
    CurrentVisualization,
    DimensionMetadataItem,
} from '@types'
import { describe, it, expect } from 'vitest'

const CELL_VALUE_ID = 'de1'

const metadataStore = createMetadataStoreStub({
    dimensions: {
        [CELL_VALUE_ID]: {
            id: CELL_VALUE_ID,
            dimensionId: CELL_VALUE_ID,
            dimensionType: 'DATA_ELEMENT',
            aggregationType: 'SUM',
        } as DimensionMetadataItem,
    },
})

const rebuild = (vis: Partial<CurrentVisualization>) => {
    const currentVis = {
        outputType: 'EVENT',
        columns: [],
        rows: [],
        filters: [],
        ...vis,
    } as unknown as CurrentVisualization

    return buildCurrentVisFromVisUiConfig({
        previousCurrentVis: currentVis,
        visUiConfig: getVisualizationUiConfig(currentVis, DEFAULT_OPTIONS),
        metadataStore,
    })
}

describe('buildCurrentVisFromVisUiConfig cell value', () => {
    it.each<AggregationType>(['DEFAULT', 'MAX'])(
        'keeps the %s aggregation type as it is',
        (aggregationType) => {
            const result = rebuild({
                type: 'PIVOT_TABLE',
                value: { id: CELL_VALUE_ID },
                aggregationType,
            })

            expect(result.value).toEqual({ id: CELL_VALUE_ID })
            expect(result.aggregationType).toBe(aggregationType)
        }
    )

    it('drops the cell value on a line list', () => {
        const result = rebuild({
            type: 'LINE_LIST',
            value: { id: CELL_VALUE_ID },
            aggregationType: 'DEFAULT',
        })

        expect(result.value).toBeUndefined()
        expect(result.aggregationType).toBeUndefined()
    })
})
