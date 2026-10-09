import { MetadataStore } from '@modules/metadata/store'
import { getVisualizationFilterText } from '@modules/visualization/filter-text'
import type { CurrentVisualization, MetadataInputMap } from '@types'
import { describe, expect, it } from 'vitest'

const PROGRAM_ID = 'prg1'
const STAGE_ID = 'stg1'

const buildStore = (items: MetadataInputMap = {}) => {
    const store = new MetadataStore({})
    store.addMetadata({
        [PROGRAM_ID]: {
            id: PROGRAM_ID,
            name: 'Programme',
            programType: 'WITHOUT_REGISTRATION',
        },
        [STAGE_ID]: {
            id: STAGE_ID,
            name: 'Stage one',
            repeatable: false,
            hideDueDate: false,
            program: { id: PROGRAM_ID },
        },
        ...items,
    })
    return store
}

const buildVis = (
    filters: CurrentVisualization['filters'],
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [],
        rows: [],
        filters,
        ...overrides,
    }) as CurrentVisualization

describe('getVisualizationFilterText', () => {
    it('returns an empty string when there are no filters', () => {
        expect(
            getVisualizationFilterText({
                visualization: buildVis([]),
                metadataStore: buildStore(),
            })
        ).toBe('')
    })

    it('names an item-based filter and its selected items', () => {
        const store = buildStore({
            [`${STAGE_ID}.ou`]: {
                id: `${STAGE_ID}.ou`,
                dimensionId: 'ou',
                name: 'Org unit',
                dimensionType: 'ORGANISATION_UNIT',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
            ImspTQPwCqd: { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
            O6uvpzGd5pu: { id: 'O6uvpzGd5pu', name: 'Bo' },
        })
        const vis = buildVis([
            {
                dimension: 'ou',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                items: [{ id: 'ImspTQPwCqd' }, { id: 'O6uvpzGd5pu' }],
            },
        ] as CurrentVisualization['filters'])

        expect(
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: store,
            })
        ).toBe('Org unit: Sierra Leone, Bo')
    })

    it('collapses org unit levels into a single entry', () => {
        const store = buildStore({
            [`${STAGE_ID}.ou`]: {
                id: `${STAGE_ID}.ou`,
                dimensionId: 'ou',
                name: 'Org unit',
                dimensionType: 'ORGANISATION_UNIT',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
            ImspTQPwCqd: { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
            LEVEL_ID: { id: 'LEVEL_ID', name: 'District' },
        })
        const vis = buildVis([
            {
                dimension: 'ou',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                items: [{ id: 'LEVEL-LEVEL_ID' }, { id: 'ImspTQPwCqd' }],
            },
        ] as CurrentVisualization['filters'])

        expect(
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: store,
            })
        ).toBe('Org unit: Sierra Leone, Levels: District')
    })

    it('renders an operator condition as text', () => {
        const store = buildStore({
            [`${STAGE_ID}.de1`]: {
                id: `${STAGE_ID}.de1`,
                dimensionId: 'de1',
                name: 'Age',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'INTEGER',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
        })
        const vis = buildVis([
            {
                dimension: 'de1',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                dimensionType: 'DATA_ELEMENT',
                valueType: 'INTEGER',
                filter: 'GT:20',
                items: [],
            },
        ] as CurrentVisualization['filters'])

        const text = getVisualizationFilterText({
            visualization: vis,
            metadataStore: store,
        })

        expect(text).toContain('Age:')
        expect(text).toContain('20')
    })

    it('joins several filters with a dash', () => {
        const store = buildStore({
            [`${STAGE_ID}.ou`]: {
                id: `${STAGE_ID}.ou`,
                dimensionId: 'ou',
                name: 'Org unit',
                dimensionType: 'ORGANISATION_UNIT',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
            [`${STAGE_ID}.eventDate`]: {
                id: `${STAGE_ID}.eventDate`,
                dimensionId: 'eventDate',
                name: 'Report date',
                dimensionType: 'PERIOD',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
            ImspTQPwCqd: { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
            THIS_YEAR: { id: 'THIS_YEAR', name: 'This year' },
        })
        const vis = buildVis([
            {
                dimension: 'ou',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                items: [{ id: 'ImspTQPwCqd' }],
            },
            {
                dimension: 'eventDate',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                items: [{ id: 'THIS_YEAR' }],
            },
        ] as CurrentVisualization['filters'])

        expect(
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: store,
            })
        ).toBe('Org unit: Sierra Leone - Report date: This year')
    })

    it('names an enrollment org unit filter', () => {
        const store = buildStore({
            [`${PROGRAM_ID}.enrollmentOu`]: {
                id: `${PROGRAM_ID}.enrollmentOu`,
                dimensionId: 'enrollmentOu',
                name: 'Enrollment org unit',
                dimensionType: 'ORGANISATION_UNIT',
                programId: PROGRAM_ID,
            },
            ImspTQPwCqd: { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
        })
        const vis = buildVis(
            [
                {
                    dimension: 'ou',
                    program: { id: PROGRAM_ID },
                    items: [{ id: 'ImspTQPwCqd' }],
                },
            ] as CurrentVisualization['filters'],
            { outputType: 'ENROLLMENT' }
        )

        expect(
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: store,
            })
        ).toBe('Enrollment org unit: Sierra Leone')
    })

    it('adds the stage name when the layout spans several stages', () => {
        const store = buildStore({
            stg2: {
                id: 'stg2',
                name: 'Stage two',
                repeatable: false,
                hideDueDate: false,
                program: { id: PROGRAM_ID },
            },
            [`${STAGE_ID}.ou`]: {
                id: `${STAGE_ID}.ou`,
                dimensionId: 'ou',
                name: 'Org unit',
                dimensionType: 'ORGANISATION_UNIT',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
            'stg2.eventDate': {
                id: 'stg2.eventDate',
                dimensionId: 'eventDate',
                name: 'Report date',
                dimensionType: 'PERIOD',
                programId: PROGRAM_ID,
                programStageId: 'stg2',
            },
            ImspTQPwCqd: { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
        })
        const vis = buildVis(
            [
                {
                    dimension: 'ou',
                    programStage: { id: STAGE_ID },
                    program: { id: PROGRAM_ID },
                    items: [{ id: 'ImspTQPwCqd' }],
                },
            ] as CurrentVisualization['filters'],
            {
                columns: [
                    {
                        dimension: 'eventDate',
                        programStage: { id: 'stg2' },
                        program: { id: PROGRAM_ID },
                    },
                ],
            } as Partial<CurrentVisualization>
        )

        expect(
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: store,
            })
        ).toBe('Org unit · Stage one: Sierra Leone')
    })

    it('skips a filter with neither items nor conditions', () => {
        const store = buildStore({
            [`${STAGE_ID}.ou`]: {
                id: `${STAGE_ID}.ou`,
                dimensionId: 'ou',
                name: 'Org unit',
                dimensionType: 'ORGANISATION_UNIT',
                programId: PROGRAM_ID,
                programStageId: STAGE_ID,
            },
        })
        const vis = buildVis([
            {
                dimension: 'ou',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                items: [],
            },
        ] as CurrentVisualization['filters'])

        expect(
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: store,
            })
        ).toBe('')
    })

    it('throws for a filter dimension with no metadata', () => {
        const vis = buildVis([
            {
                dimension: 'unknown',
                programStage: { id: STAGE_ID },
                program: { id: PROGRAM_ID },
                items: [{ id: 'x' }],
            },
        ] as CurrentVisualization['filters'])

        expect(() =>
            getVisualizationFilterText({
                visualization: vis,
                metadataStore: buildStore(),
            })
        ).toThrow()
    })
})
