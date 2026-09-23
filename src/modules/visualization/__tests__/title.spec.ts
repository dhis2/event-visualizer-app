import { MetadataStore } from '@modules/metadata/store'
import { getVisualizationTitle } from '@modules/visualization/title'
import type { CurrentVisualization, MetadataInputMap } from '@types'
import { describe, expect, it } from 'vitest'

const PROGRAM_ID = 'prg1'
const TET_ID = 'tet1'

const buildStore = (items: MetadataInputMap = {}) => {
    const store = new MetadataStore({})
    store.addMetadata({
        [PROGRAM_ID]: {
            id: PROGRAM_ID,
            name: 'Programme',
            programType: 'WITHOUT_REGISTRATION',
        },
        ...items,
    })
    return store
}

const buildVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [{ dimension: 'ou', program: { id: PROGRAM_ID } }],
        rows: [],
        filters: [],
        ...overrides,
    }) as CurrentVisualization

describe('getVisualizationTitle', () => {
    it('returns undefined when the title is hidden', () => {
        const vis = buildVis({ hideTitle: true, title: 'Ignored' })

        expect(getVisualizationTitle(vis, buildStore())).toBeUndefined()
    })

    it('returns the custom title when one is set', () => {
        const vis = buildVis({ title: 'My title' })

        expect(getVisualizationTitle(vis, buildStore())).toBe('My title')
    })

    it('treats a whitespace-only title as absent and generates instead', () => {
        const vis = buildVis({ title: '   ' })

        expect(getVisualizationTitle(vis, buildStore())).toBe('Events')
    })

    it('generates the bare plural when the program has no custom labels', () => {
        expect(getVisualizationTitle(buildVis(), buildStore())).toBe('Events')
        expect(
            getVisualizationTitle(
                buildVis({ type: 'PIVOT_TABLE' }),
                buildStore()
            )
        ).toBe('Events')
    })

    it('prefers the plural event label for both visualization types', () => {
        const store = buildStore({
            [PROGRAM_ID]: {
                id: PROGRAM_ID,
                name: 'Programme',
                programType: 'WITHOUT_REGISTRATION',
                displayEventLabel: 'visit',
                displayEventsLabel: 'Visits',
            },
        })

        expect(getVisualizationTitle(buildVis(), store)).toBe('Visits')
        expect(
            getVisualizationTitle(buildVis({ type: 'PIVOT_TABLE' }), store)
        ).toBe('Visits')
    })

    it('falls back to the singular event label with per-type wording', () => {
        const store = buildStore({
            [PROGRAM_ID]: {
                id: PROGRAM_ID,
                name: 'Programme',
                programType: 'WITHOUT_REGISTRATION',
                displayEventLabel: 'Visit',
            },
        })

        expect(getVisualizationTitle(buildVis(), store)).toBe('Visit list')
        expect(
            getVisualizationTitle(buildVis({ type: 'PIVOT_TABLE' }), store)
        ).toBe('Visit count')
    })

    it('uses the enrollment labels for enrollment output', () => {
        const store = buildStore({
            [PROGRAM_ID]: {
                id: PROGRAM_ID,
                name: 'Programme',
                programType: 'WITH_REGISTRATION',
                displayEnrollmentLabel: 'Pregnancy',
            },
        })

        expect(
            getVisualizationTitle(buildVis({ outputType: 'ENROLLMENT' }), store)
        ).toBe('Pregnancy list')
        expect(
            getVisualizationTitle(
                buildVis({ outputType: 'ENROLLMENT', type: 'PIVOT_TABLE' }),
                store
            )
        ).toBe('Pregnancy count')
    })

    it('prefers the plural enrollment label', () => {
        const store = buildStore({
            [PROGRAM_ID]: {
                id: PROGRAM_ID,
                name: 'Programme',
                programType: 'WITH_REGISTRATION',
                displayEnrollmentLabel: 'Pregnancy',
                displayEnrollmentsLabel: 'Pregnancies',
            },
        })

        expect(
            getVisualizationTitle(buildVis({ outputType: 'ENROLLMENT' }), store)
        ).toBe('Pregnancies')
    })

    it('generates Enrollments when the program has no enrollment labels', () => {
        expect(
            getVisualizationTitle(
                buildVis({ outputType: 'ENROLLMENT' }),
                buildStore()
            )
        ).toBe('Enrollments')
    })

    it('uses the tracked entity type plural label when present', () => {
        const store = buildStore({
            [TET_ID]: {
                id: TET_ID,
                name: 'Person',
                displayTrackedEntityTypesLabel: 'Patients',
            },
        })
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET_ID, name: 'Person' },
        })

        expect(getVisualizationTitle(vis, store)).toBe('Patients')
    })

    it('falls back to the tracked entity type name with per-type wording', () => {
        const store = buildStore({ [TET_ID]: { id: TET_ID, name: 'Patient' } })
        const vis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET_ID, name: 'Patient' },
        })

        expect(getVisualizationTitle(vis, store)).toBe('Patient list')
        expect(
            getVisualizationTitle({ ...vis, type: 'PIVOT_TABLE' }, store)
        ).toBe('Patient count')
    })

    it('replaces the output-type title with the custom value on a pivot', () => {
        const store = buildStore({
            de1: { id: 'de1', name: 'MCH Apgar score' },
        })
        const vis = buildVis({
            type: 'PIVOT_TABLE',
            value: { id: 'de1' },
            aggregationType: 'AVERAGE',
        })

        expect(getVisualizationTitle(vis, store)).toBe(
            'MCH Apgar score · Average'
        )
    })

    it('ignores a custom value that is missing its aggregation type', () => {
        const store = buildStore({
            de1: { id: 'de1', name: 'MCH Apgar score' },
        })
        const vis = buildVis({ type: 'PIVOT_TABLE', value: { id: 'de1' } })

        expect(getVisualizationTitle(vis, store)).toBe('Events')
    })

    it('ignores a custom value whose item is unknown to the metadata store', () => {
        const vis = buildVis({
            type: 'PIVOT_TABLE',
            value: { id: 'missing' },
            aggregationType: 'AVERAGE',
        })

        expect(getVisualizationTitle(vis, buildStore())).toBe('Events')
    })

    it('ignores a custom value on a line list', () => {
        const store = buildStore({
            de1: { id: 'de1', name: 'MCH Apgar score' },
        })
        const vis = buildVis({
            value: { id: 'de1' },
            aggregationType: 'AVERAGE',
        })

        expect(getVisualizationTitle(vis, store)).toBe('Events')
    })

    it('falls back to the bare plural for an empty layout', () => {
        const vis = buildVis({ columns: [], rows: [], filters: [] })

        expect(getVisualizationTitle(vis, buildStore())).toBe('Events')
    })

    it('picks the first program in axis order for multi-program layouts', () => {
        const store = buildStore({
            [PROGRAM_ID]: {
                id: PROGRAM_ID,
                name: 'First',
                programType: 'WITH_REGISTRATION',
                displayEventsLabel: 'Visits',
            },
            prg2: {
                id: 'prg2',
                name: 'Second',
                programType: 'WITH_REGISTRATION',
                displayEventsLabel: 'Doses',
            },
        })
        const vis = buildVis({
            columns: [{ dimension: 'ou', program: { id: PROGRAM_ID } }],
            filters: [{ dimension: 'x', program: { id: 'prg2' } }],
        } as Partial<CurrentVisualization>)

        expect(getVisualizationTitle(vis, store)).toBe('Visits')
    })
})
