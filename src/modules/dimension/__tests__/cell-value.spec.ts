import {
    getCellValueMetadataItemOrThrow,
    isValidCellValueDimension,
} from '@modules/dimension/cell-value'
import { MetadataStore } from '@modules/metadata/store'
import legacyEventPivotTableCustomValue from '@modules/visualization/__fixtures__/round-trip/legacy/event-pivot-table-custom-value.json'
import eventPivotTableAttributeValue from '@modules/visualization/__fixtures__/round-trip/saved/event-pivot-table-attribute-value.json'
import eventPivotTableCustomValue from '@modules/visualization/__fixtures__/round-trip/saved/event-pivot-table-custom-value.json'
import { normalizeApiSavedVisualization } from '@modules/visualization/normalize-legacy'
import type {
    ApiSavedVisualization,
    DimensionMetadataItem,
    SavedVisualization,
} from '@types'
import { describe, it, expect } from 'vitest'

const dim = (valueType?: string) =>
    ({ valueType }) as unknown as DimensionMetadataItem

describe('isValidCellValueDimension', () => {
    it.each(['NUMBER', 'INTEGER', 'PERCENTAGE', 'BOOLEAN', 'TRUE_ONLY'])(
        'accepts %s, which aggregates numerically',
        (valueType) => {
            expect(isValidCellValueDimension(dim(valueType))).toBe(true)
        }
    )

    it.each(['TEXT', 'DATE', 'ORGANISATION_UNIT'])(
        'rejects %s',
        (valueType) => {
            expect(isValidCellValueDimension(dim(valueType))).toBe(false)
        }
    )

    /* Program indicators and the structural dimensions carry no value type. */
    it('rejects a dimension with no value type', () => {
        expect(isValidCellValueDimension(dim(undefined))).toBe(false)
    })

    it('rejects a dimension that is missing entirely', () => {
        expect(isValidCellValueDimension(undefined)).toBe(false)
    })
})

describe('getCellValueMetadataItemOrThrow', () => {
    const PERSON_TET = 'nEenWmSyUEp'

    /* Registers a loaded visualization the way the app does, then looks the
     * value up from its id and stage alone, as a visualization rebuilt from
     * the ui config carries it. */
    const lookUpLoadedValue = (fixture: unknown) => {
        const vis = normalizeApiSavedVisualization(
            fixture as ApiSavedVisualization
        )
        const metadataStore = new MetadataStore({})
        metadataStore.setVisualizationMetadata(vis)
        const { id, programStage } = vis.value!

        return getCellValueMetadataItemOrThrow(
            { id, programStage },
            vis,
            metadataStore
        )
    }

    it('finds a data element value by its stage', () => {
        expect(lookUpLoadedValue(eventPivotTableCustomValue)).toMatchObject({
            id: 'A03MvHHogjR.UXz7xuGCEhU',
            name: 'MCH Weight (g)',
        })
    })

    it('finds a legacy data element value by the root stage', () => {
        expect(
            lookUpLoadedValue(legacyEventPivotTableCustomValue)
        ).toMatchObject({
            id: 'A03MvHHogjR.UXz7xuGCEhU',
            name: 'MCH Weight (g)',
        })
    })

    it('finds an attribute value under the tracked entity type', () => {
        expect(lookUpLoadedValue(eventPivotTableAttributeValue)).toMatchObject({
            id: `${PERSON_TET}.OvY4VVhSDeJ`,
            name: 'Weight in kg',
        })
    })

    const trackerVis: Pick<SavedVisualization, 'programDimensions'> = {
        programDimensions: [
            { id: 'program1', trackedEntityType: { id: PERSON_TET } },
        ] as SavedVisualization['programDimensions'],
    }

    it('finds a program indicator value by its plain id', () => {
        const metadataStore = new MetadataStore({})
        metadataStore.addMetadata({
            id: 'indicator1',
            name: 'Indicator',
            dimensionType: 'PROGRAM_INDICATOR',
        })

        expect(
            getCellValueMetadataItemOrThrow(
                { id: 'indicator1' },
                trackerVis,
                metadataStore
            )
        ).toMatchObject({ id: 'indicator1', name: 'Indicator' })
    })

    /* Saved before the cell value carried its stage. */
    it('finds a data element value without a stage by its plain id', () => {
        const metadataStore = new MetadataStore({})
        metadataStore.addMetadata({
            id: 'dataElement1',
            name: 'Data element',
            dimensionType: 'DATA_ELEMENT',
        })

        expect(
            getCellValueMetadataItemOrThrow(
                { id: 'dataElement1' },
                {},
                metadataStore
            )
        ).toMatchObject({ id: 'dataElement1', name: 'Data element' })
    })

    it('throws when the store has no metadata for the value', () => {
        expect(() =>
            getCellValueMetadataItemOrThrow(
                { id: 'missing1' },
                trackerVis,
                new MetadataStore({})
            )
        ).toThrow('missing1')
    })
})
