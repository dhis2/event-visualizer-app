import { transformProgramAttributes } from '@components/sidebar/cards-program-with-registration/card-tracked-entity-type'
import { DEFAULT_OPTIONS } from '@constants/options'
import { MetadataStore } from '@modules/metadata/store'
import { getVisualizationFilterText } from '@modules/visualization/filter-text'
import {
    getVisualizationUiConfig,
    normalizeApiSavedVisualization,
    toCurrentVis,
} from '@modules/visualization/state'
import { buildCurrentVisFromVisUiConfig } from '@store/thunks'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type {
    ApiSavedVisualization,
    CurrentVisualization,
    OutputType,
} from '@types'
import { describe, expect, it } from 'vitest'

const PROGRAM_ID = 'trackerPrg1'
const STAGE_ID = 'trackerStg1'
const TET_ID = 'personTet1'
const TEA_ID = 'firstName1'

const trackerProgram = {
    id: PROGRAM_ID,
    name: 'Child programme',
    programType: 'WITH_REGISTRATION',
    trackedEntityType: { id: TET_ID, name: 'Person' },
    programStages: [
        {
            id: STAGE_ID,
            name: 'Birth',
            repeatable: false,
            hideDueDate: false,
            program: { id: PROGRAM_ID },
        },
    ],
}

const stageDataElementColumn = {
    dimension: 'de1',
    dimensionType: 'PROGRAM_DATA_ELEMENT',
    valueType: 'TEXT',
    items: [],
}

const teaFilter = {
    dimension: TEA_ID,
    dimensionType: 'PROGRAM_ATTRIBUTE',
    valueType: 'TEXT',
    filter: 'EQ:Anna',
    items: [],
}

const buildApiVis = (
    overrides: Record<string, unknown>
): ApiSavedVisualization =>
    ({
        id: 'vis1',
        type: 'LINE_LIST',
        rows: [],
        attributeDimensions: [{ attribute: { id: TEA_ID } }],
        metaData: {
            de1: { name: 'Weight' },
            [TEA_ID]: { name: 'First name' },
        },
        ...overrides,
    }) as unknown as ApiSavedVisualization

/* Runs the steps the app takes to load a visualization and then press Update
 * without changing anything. */
const loadAndUpdate = (apiVis: ApiSavedVisualization) => {
    const savedVis = normalizeApiSavedVisualization(apiVis)
    const metadataStore = new MetadataStore({})
    metadataStore.setVisualizationMetadata(savedVis)
    const currentVis = toCurrentVis(savedVis)

    const updatedVis = buildCurrentVisFromVisUiConfig({
        previousCurrentVis: currentVis,
        visUiConfig: getVisualizationUiConfig(currentVis, DEFAULT_OPTIONS),
        metadataStore,
    })

    return {
        updatedVis,
        filterText: getVisualizationFilterText({
            visualization: updatedVis,
            metadataStore,
        }),
    }
}

/* The id the sidebar's registration card gives the attribute, from the
 * response shape of the analytics dimensions endpoint. */
const getSidebarAttributeId = (): string =>
    transformProgramAttributes(
        {
            pager: { page: 1, pageCount: 1, pageSize: 50, total: 1 },
            dimensions: [
                {
                    id: TEA_ID,
                    name: 'First name',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                    valueType: 'TEXT',
                },
            ],
        },
        TET_ID
    ).dimensions[0].id

const getLoadedLayoutFilters = (apiVis: ApiSavedVisualization): string[] =>
    getVisualizationUiConfig(
        toCurrentVis(normalizeApiSavedVisualization(apiVis)),
        DEFAULT_OPTIONS
    ).layout.filters

describe('loading a visualization with a tracked entity attribute', () => {
    it.each<OutputType>(['EVENT', 'ENROLLMENT'])(
        'gives the attribute of an %s visualization the sidebar id',
        (outputType) => {
            const apiVis = buildApiVis({
                outputType,
                programDimensions: [trackerProgram],
                columns: [
                    {
                        ...stageDataElementColumn,
                        program: { id: PROGRAM_ID },
                        programStage: { id: STAGE_ID },
                    },
                ],
                filters: [teaFilter],
            })

            expect(getLoadedLayoutFilters(apiVis)).toEqual([
                getSidebarAttributeId(),
            ])
        }
    )

    it('gives the attribute of a legacy visualization the sidebar id', () => {
        const apiVis = buildApiVis({
            outputType: 'EVENT',
            program: trackerProgram,
            programStage: trackerProgram.programStages[0],
            programDimensions: [],
            columns: [stageDataElementColumn],
            filters: [teaFilter],
        })

        expect(getLoadedLayoutFilters(apiVis)).toEqual([
            getSidebarAttributeId(),
        ])
    })

    it('gives the attribute of a tracked entity visualization the sidebar id', () => {
        const apiVis = buildApiVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: trackerProgram.trackedEntityType,
            programDimensions: [trackerProgram],
            columns: [
                {
                    ...stageDataElementColumn,
                    program: { id: PROGRAM_ID },
                    programStage: { id: STAGE_ID },
                },
            ],
            filters: [teaFilter],
        })

        expect(getLoadedLayoutFilters(apiVis)).toEqual([
            getSidebarAttributeId(),
        ])
    })
})

describe('updating a loaded visualization with a tracked entity attribute', () => {
    it.each<OutputType>(['EVENT', 'ENROLLMENT'])(
        'keeps the %s filter line',
        (outputType) => {
            const apiVis = buildApiVis({
                outputType,
                programDimensions: [trackerProgram],
                columns: [
                    {
                        ...stageDataElementColumn,
                        program: { id: PROGRAM_ID },
                        programStage: { id: STAGE_ID },
                    },
                ],
                filters: [teaFilter],
            })

            expect(loadAndUpdate(apiVis).filterText).toBe(
                'First name: Exactly: Anna'
            )
        }
    )

    it('keeps the filter line of a legacy visualization', () => {
        const apiVis = buildApiVis({
            outputType: 'EVENT',
            program: trackerProgram,
            programStage: trackerProgram.programStages[0],
            programDimensions: [],
            columns: [stageDataElementColumn],
            filters: [teaFilter],
        })

        expect(loadAndUpdate(apiVis).filterText).toBe(
            'First name: Exactly: Anna'
        )
    })

    /* The backend reads a tracked entity type on an event visualization as
     * marking a multi-program (tracked entity) visualization, whatever its
     * output type. */
    it.each<OutputType>(['EVENT', 'ENROLLMENT'])(
        'does not give the %s visualization a tracked entity type',
        (outputType) => {
            const apiVis = buildApiVis({
                outputType,
                programDimensions: [trackerProgram],
                columns: [
                    {
                        ...stageDataElementColumn,
                        program: { id: PROGRAM_ID },
                        programStage: { id: STAGE_ID },
                    },
                ],
                filters: [teaFilter],
            })

            expect(
                loadAndUpdate(apiVis).updatedVis.trackedEntityType
            ).toBeUndefined()
        }
    )
})

describe('applying a visualization built from the sidebar with a tracked entity attribute', () => {
    const buildSidebarStore = () => {
        const store = new MetadataStore({})
        store.addMetadata({
            [PROGRAM_ID]: trackerProgram,
            [TET_ID]: { id: TET_ID, name: 'Person' },
            [`${STAGE_ID}.de1`]: {
                id: `${STAGE_ID}.de1`,
                dimensionId: 'de1',
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
            [`${TET_ID}.${TEA_ID}`]: {
                id: `${TET_ID}.${TEA_ID}`,
                dimensionId: TEA_ID,
                name: 'First name',
                dimensionType: 'PROGRAM_ATTRIBUTE',
                valueType: 'TEXT',
                trackedEntityTypeId: TET_ID,
            },
        })
        return store
    }

    it.each<OutputType>(['EVENT', 'ENROLLMENT'])(
        'shows the %s filter line',
        (outputType) => {
            const metadataStore = buildSidebarStore()
            const teaId = `${TET_ID}.${TEA_ID}`
            const appliedVis = buildCurrentVisFromVisUiConfig({
                previousCurrentVis: {},
                visUiConfig: {
                    ...getVisualizationUiConfig(
                        {
                            type: 'LINE_LIST',
                            outputType,
                        } as CurrentVisualization,
                        DEFAULT_OPTIONS
                    ),
                    layout: {
                        columns: [`${STAGE_ID}.de1`],
                        rows: [],
                        filters: [teaId],
                    },
                    conditionsByDimension: {
                        [teaId]: { condition: 'EQ:Anna' },
                    },
                } as VisUiConfigState,
                metadataStore,
            })

            expect(appliedVis.trackedEntityType).toBeUndefined()
            expect(
                getVisualizationFilterText({
                    visualization: appliedVis,
                    metadataStore,
                })
            ).toBe('First name: Exactly: Anna')
        }
    )
})
