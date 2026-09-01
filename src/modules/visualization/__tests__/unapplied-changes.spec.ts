import { DEFAULT_OPTIONS } from '@constants/options'
import {
    areVisualizationsEquivalent,
    getVisualizationUiConfig,
} from '@modules/visualization/state'
import { buildCurrentVisFromVisUiConfig } from '@store/thunks'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'

const STAGE_ID = 'stage1'
const DIMENSION_ID = `${STAGE_ID}.de1`

const metadataStore = createMetadataStoreStub({
    dimensions: {
        [DIMENSION_ID]: {
            id: DIMENSION_ID,
            name: 'Data element 1',
            dimensionId: 'de1',
            programStageId: STAGE_ID,
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        } as DimensionMetadataItem,
    },
})

const baseCurrentVis = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization

/* Compose the two functions exactly as useHasUnappliedChanges does, so these
 * tests cannot drift from the app. */
const buildFutureVis = (
    currentVis: CurrentVisualization,
    visUiConfigOverrides: Partial<VisUiConfigState> = {}
): CurrentVisualization =>
    buildCurrentVisFromVisUiConfig({
        previousCurrentVis: currentVis,
        visUiConfig: {
            ...getVisualizationUiConfig(currentVis, DEFAULT_OPTIONS),
            ...visUiConfigOverrides,
        },
        metadataStore,
    })

describe('detecting unapplied changes', () => {
    it('reports no change for a visualization rebuilt from its own ui config', () => {
        const futureVis = buildFutureVis(baseCurrentVis)

        expect(areVisualizationsEquivalent(baseCurrentVis, futureVis)).toBe(
            true
        )
    })

    it('reports a change when an option is changed', () => {
        const futureVis = buildFutureVis(baseCurrentVis, {
            options: { ...DEFAULT_OPTIONS, displayDensity: 'COMFORTABLE' },
        })

        expect(areVisualizationsEquivalent(baseCurrentVis, futureVis)).toBe(
            false
        )
    })

    it('reports no change when an option is set to its own default value', () => {
        const futureVis = buildFutureVis(baseCurrentVis, {
            options: { ...DEFAULT_OPTIONS, showData: DEFAULT_OPTIONS.showData },
        })

        expect(areVisualizationsEquivalent(baseCurrentVis, futureVis)).toBe(
            true
        )
    })

    it('reports a change when a dimension is added to an axis', () => {
        const futureVis = buildFutureVis(baseCurrentVis, {
            layout: { columns: [DIMENSION_ID], rows: [], filters: [] },
        })

        expect(areVisualizationsEquivalent(baseCurrentVis, futureVis)).toBe(
            false
        )
    })

    it('reports a change when the visualization type is switched', () => {
        const futureVis = buildFutureVis(baseCurrentVis, {
            visualizationType: 'PIVOT_TABLE',
        })

        expect(areVisualizationsEquivalent(baseCurrentVis, futureVis)).toBe(
            false
        )
    })

    it('reports no change for a visualization that has been sorted on the canvas', () => {
        const sortedVis = {
            ...baseCurrentVis,
            sorting: [{ dimension: 'de1', direction: 'ASC' }],
        } as unknown as CurrentVisualization

        const futureVis = buildFutureVis(sortedVis)

        expect(areVisualizationsEquivalent(sortedVis, futureVis)).toBe(true)
    })

    /* The custom value config is deliberately not compared: the custom value
     * modal still applies in one step, so a pending custom value change never
     * reaches this comparison. */
    it('reports no change when a custom value is configured but never applied', () => {
        const futureVis = buildFutureVis(baseCurrentVis, {
            customValue: { id: 'de2', aggregationType: 'SUM' },
        })

        expect(areVisualizationsEquivalent(baseCurrentVis, futureVis)).toBe(
            true
        )
    })
})
