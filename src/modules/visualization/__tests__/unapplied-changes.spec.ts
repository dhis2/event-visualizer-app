import { DEFAULT_OPTIONS } from '@constants/options'
import { buildCurrentVisFromVisUiConfig } from '@modules/visualization/current-vis'
import { areVisualizationsEquivalent } from '@modules/visualization/state'
import { getVisualizationUiConfig } from '@modules/visualization/ui-config'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type {
    CurrentVisualization,
    DimensionMetadataItem,
    DimensionRecord,
    MetadataStore,
    Program,
} from '@types'
import { describe, it, expect } from 'vitest'

const PROGRAM_ID = 'program1'
const STAGE_ID = 'stage1'
const DIMENSION_ID = `${STAGE_ID}.de1`
const OPTION_SET_ID = 'optionSet1'
const LEGEND_SET_ID = 'legendSet1'
const CUSTOM_VALUE_ID = 'de2'

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
const hasUnappliedChanges = (
    currentVis: CurrentVisualization,
    visUiConfigOverrides: Partial<VisUiConfigState> = {},
    store: MetadataStore = metadataStore
): boolean =>
    !areVisualizationsEquivalent(
        currentVis,
        buildCurrentVisFromVisUiConfig({
            previousCurrentVis: currentVis,
            visUiConfig: {
                ...getVisualizationUiConfig(currentVis, DEFAULT_OPTIONS),
                ...visUiConfigOverrides,
            },
            metadataStore: store,
        })
    )

describe('detecting unapplied changes', () => {
    it('reports no change for a visualization rebuilt from its own ui config', () => {
        expect(hasUnappliedChanges(baseCurrentVis)).toBe(false)
    })

    it('reports a change when an option is changed', () => {
        expect(
            hasUnappliedChanges(baseCurrentVis, {
                options: { ...DEFAULT_OPTIONS, displayDensity: 'COMFORTABLE' },
            })
        ).toBe(true)
    })

    it('reports no change when an option is set to its own default value', () => {
        expect(
            hasUnappliedChanges(baseCurrentVis, {
                options: {
                    ...DEFAULT_OPTIONS,
                    showData: DEFAULT_OPTIONS.showData,
                },
            })
        ).toBe(false)
    })

    it('reports a change when a dimension is added to an axis', () => {
        expect(
            hasUnappliedChanges(baseCurrentVis, {
                layout: { columns: [DIMENSION_ID], rows: [], filters: [] },
            })
        ).toBe(true)
    })

    it('reports a change when the visualization type is switched', () => {
        expect(
            hasUnappliedChanges(baseCurrentVis, {
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBe(true)
    })

    it('reports no change for a visualization that has been sorted on the canvas', () => {
        const sortedVis = {
            ...baseCurrentVis,
            sorting: [{ dimension: 'de1', direction: 'ASC' }],
        } as unknown as CurrentVisualization

        expect(hasUnappliedChanges(sortedVis)).toBe(false)
    })

    /* The builder only populates the custom value fields when the current vis
     * already carries one, so configuring a custom value against a vis without
     * one leaves both sides undefined. */
    it('reports no change when a custom value is configured on a visualization that has none', () => {
        expect(
            hasUnappliedChanges(baseCurrentVis, {
                customValue: { id: CUSTOM_VALUE_ID, aggregationType: 'SUM' },
            })
        ).toBe(false)
    })
})

/* A freshly loaded visualization is compared in the shape the eventVisualizations
 * API returns it, against the shape the builder produces from its own ui config.
 * The API returns more per dimension than the builder can rebuild, and none of
 * that counts as an unapplied change. */
describe('detecting unapplied changes in a freshly loaded visualization', () => {
    const createLoadedMetadataStore = (
        dimensionOverrides: Partial<DimensionMetadataItem> = {}
    ): MetadataStore =>
        createMetadataStoreStub({
            dimensions: {
                [DIMENSION_ID]: {
                    id: DIMENSION_ID,
                    name: 'Data element 1',
                    dimensionId: 'de1',
                    programId: PROGRAM_ID,
                    programStageId: STAGE_ID,
                    dimensionType: 'DATA_ELEMENT',
                    valueType: 'TEXT',
                    ...dimensionOverrides,
                } as DimensionMetadataItem,
            },
            programs: {
                [PROGRAM_ID]: { id: PROGRAM_ID, name: 'Program 1' } as Program,
            },
        })

    // The shape the API returns for a data element dimension.
    const createLoadedColumn = (
        overrides: Partial<DimensionRecord> = {}
    ): DimensionRecord => ({
        dimension: 'de1',
        dimensionType: 'PROGRAM_DATA_ELEMENT',
        program: { id: PROGRAM_ID },
        programStage: { id: STAGE_ID },
        valueType: 'TEXT',
        items: [],
        ...overrides,
    })

    const createLoadedVis = (
        column: DimensionRecord,
        overrides: Partial<CurrentVisualization> = {}
    ): CurrentVisualization =>
        ({
            ...baseCurrentVis,
            columns: [column],
            ...overrides,
        }) as unknown as CurrentVisualization

    it('reports no change for a dimension carrying an option set with its name', () => {
        const loadedVis = createLoadedVis(
            createLoadedColumn({
                optionSet: { id: OPTION_SET_ID, name: 'Option set 1' },
            })
        )

        expect(
            hasUnappliedChanges(
                loadedVis,
                {},
                createLoadedMetadataStore({ optionSetId: OPTION_SET_ID })
            )
        ).toBe(false)
    })

    it('reports no change for a dimension carrying a legend set with its name', () => {
        const loadedVis = createLoadedVis(
            createLoadedColumn({
                legendSet: { id: LEGEND_SET_ID, name: 'Legend set 1' },
            })
        )

        expect(
            hasUnappliedChanges(loadedVis, {}, createLoadedMetadataStore())
        ).toBe(false)
    })

    const createLoadedRepetitionColumn = (): DimensionRecord =>
        createLoadedColumn({
            repetition: {
                indexes: [1, 2],
                dimension: 'de1',
                parent: 'COLUMN',
                program: PROGRAM_ID,
                programStage: STAGE_ID,
            },
        })

    it('reports a change when a repetition is edited', () => {
        const loadedVis = createLoadedVis(createLoadedRepetitionColumn())

        expect(
            hasUnappliedChanges(
                loadedVis,
                {
                    repetitionsByDimension: {
                        [DIMENSION_ID]: { mostRecent: 3, oldest: 0 },
                    },
                },
                createLoadedMetadataStore()
            )
        ).toBe(true)
    })

    it('reports no change for a dimension carrying a repetition with its backend-derived context', () => {
        const loadedVis = createLoadedVis(createLoadedRepetitionColumn())

        expect(
            hasUnappliedChanges(loadedVis, {}, createLoadedMetadataStore())
        ).toBe(false)
    })

    it('reports no change for a visualization carrying a custom value with its name and aggregation type', () => {
        const loadedVis = createLoadedVis(createLoadedColumn(), {
            type: 'PIVOT_TABLE',
            value: {
                id: CUSTOM_VALUE_ID,
                name: 'Weight in kg',
                aggregationType: 'AVERAGE',
            },
            aggregationType: 'AVERAGE',
        })

        expect(
            hasUnappliedChanges(loadedVis, {}, createLoadedMetadataStore())
        ).toBe(false)
    })

    /* Known gap, pending the custom value rework: for a custom value
     * visualization saved without a top-level aggregationType the ui config
     * defaults the custom value's aggregation type to DEFAULT, which is not
     * the SUM the options default to, so the two sides differ on
     * aggregationType alone and the notice appears with nothing changed.
     * Accommodating this would mean custom-value-specific logic in the
     * comparison, which the rework will make obsolete. */
    it('wrongly reports a change for a custom value visualization with no persisted aggregation type', () => {
        const loadedVis = createLoadedVis(createLoadedColumn(), {
            type: 'PIVOT_TABLE',
            value: { id: CUSTOM_VALUE_ID },
        })

        expect(
            hasUnappliedChanges(loadedVis, {}, createLoadedMetadataStore())
        ).toBe(true)
    })

    it('reports a change when a dimension is added to a loaded visualization', () => {
        const loadedVis = createLoadedVis(
            createLoadedColumn({
                optionSet: { id: OPTION_SET_ID, name: 'Option set 1' },
            })
        )

        expect(
            hasUnappliedChanges(
                loadedVis,
                { layout: { columns: [], rows: [], filters: [DIMENSION_ID] } },
                createLoadedMetadataStore({ optionSetId: OPTION_SET_ID })
            )
        ).toBe(true)
    })
})
