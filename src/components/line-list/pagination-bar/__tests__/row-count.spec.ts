import { getRowCountText } from '@components/line-list/pagination-bar/row-count'
import i18n from '@dhis2/d2-i18n'
import { MetadataStore } from '@modules/metadata/store'
import type { CurrentVisualization, MetadataInputMap } from '@types'
import { beforeAll, describe, expect, it } from 'vitest'

const PROGRAM_ID = 'prg1'
const TET_ID = 'tet1'

const buildStore = (items: MetadataInputMap = {}) => {
    const store = new MetadataStore({})
    store.addMetadata(items)
    return store
}

const buildVis = (
    overrides: Partial<CurrentVisualization> = {},
    programLabels: Record<string, string> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        digitGroupSeparator: 'COMMA',
        columns: [],
        rows: [],
        filters: [],
        programDimensions: [
            {
                id: PROGRAM_ID,
                name: 'Programme',
                programType: 'WITH_REGISTRATION',
                ...programLabels,
            },
        ],
        ...overrides,
    }) as CurrentVisualization

describe('getRowCountText', () => {
    /* Unit tests don't load the generated locales, which hold the plural
     * forms, so register the English ones from i18n/en.pot here. */
    beforeAll(() => {
        i18n.addResourceBundle('en', 'translation', {
            '{{- formattedCount}} event_plural': '{{- formattedCount}} events',
            '{{- formattedCount}} enrollment_plural':
                '{{- formattedCount}} enrollments',
            '{{- formattedCount}} tracked entity_plural':
                '{{- formattedCount}} tracked entities',
        })
    })

    describe('events', () => {
        it('uses the singular for one', () => {
            expect(getRowCountText(1, buildVis(), buildStore())).toBe('1 event')
        })

        it('uses the plural and the digit group separator', () => {
            expect(getRowCountText(1234, buildVis(), buildStore())).toBe(
                '1,234 events'
            )
            expect(
                getRowCountText(
                    1234,
                    buildVis({ digitGroupSeparator: 'SPACE' }),
                    buildStore()
                )
            ).toBe('1 234 events')
        })

        it('uses the program plural label', () => {
            const vis = buildVis({}, { displayEventsLabel: 'Visits' })

            expect(getRowCountText(1234, vis, buildStore())).toBe(
                '1,234 Visits'
            )
        })

        it('uses the standard singular for one, even with a plural label', () => {
            const vis = buildVis({}, { displayEventsLabel: 'Visits' })

            expect(getRowCountText(1, vis, buildStore())).toBe('1 event')
        })

        it('ignores an empty plural label', () => {
            const vis = buildVis({}, { displayEventsLabel: '' })

            expect(getRowCountText(2, vis, buildStore())).toBe('2 events')
        })
    })

    describe('enrollments', () => {
        it('uses the standard words', () => {
            const vis = buildVis({ outputType: 'ENROLLMENT' })

            expect(getRowCountText(1, vis, buildStore())).toBe('1 enrollment')
            expect(getRowCountText(2, vis, buildStore())).toBe('2 enrollments')
        })

        it('uses the program plural label', () => {
            const vis = buildVis(
                { outputType: 'ENROLLMENT' },
                { displayEnrollmentsLabel: 'Cases' }
            )

            expect(getRowCountText(2, vis, buildStore())).toBe('2 Cases')
        })
    })

    describe('tracked entities', () => {
        const tetVis = buildVis({
            outputType: 'TRACKED_ENTITY_INSTANCE',
            trackedEntityType: { id: TET_ID, name: 'Person' },
        })

        it('uses the standard words', () => {
            const store = buildStore({
                [TET_ID]: { id: TET_ID, name: 'Person' },
            })

            expect(getRowCountText(1, tetVis, store)).toBe('1 tracked entity')
            expect(getRowCountText(5, tetVis, store)).toBe('5 tracked entities')
        })

        it('uses the tracked entity type plural label', () => {
            const store = buildStore({
                [TET_ID]: {
                    id: TET_ID,
                    name: 'Person',
                    displayTrackedEntityTypesLabel: 'Persons',
                },
            })

            expect(getRowCountText(5, tetVis, store)).toBe('5 Persons')
        })
    })
})
