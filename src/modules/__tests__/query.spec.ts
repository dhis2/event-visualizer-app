import {
    getAggregatableDimensionFields,
    getDimensionMetadataFields,
    getProgramFields,
    getTrackedEntityTypeFields,
} from '@modules/query'
import { describe, expect, it } from 'vitest'

describe('getProgramFields', () => {
    it('requests both singular and plural event and enrollment labels', () => {
        const fields = getProgramFields('displayName').split(',')

        expect(fields).toContain('displayEventLabel')
        expect(fields).toContain('displayEventsLabel')
        expect(fields).toContain('displayEnrollmentLabel')
        expect(fields).toContain('displayEnrollmentsLabel')
    })

    it('requests the plural label on the nested tracked entity type', () => {
        expect(getProgramFields('displayName')).toContain(
            'trackedEntityType[id,displayName~rename(name),displayTrackedEntityTypesLabel]'
        )
    })
})

describe('getTrackedEntityTypeFields', () => {
    it('requests the plural tracked entity type label', () => {
        expect(getTrackedEntityTypeFields('displayName').split(',')).toContain(
            'displayTrackedEntityTypesLabel'
        )
    })
})

describe('getAggregatableDimensionFields', () => {
    it('requests what the cell value axis reads, named by the display property', () => {
        expect(
            getAggregatableDimensionFields('displayShortName').split(',')
        ).toEqual([
            'id',
            'displayShortName~rename(name)',
            'valueType',
            'aggregationType',
        ])
    })
})

describe('getDimensionMetadataFields', () => {
    /* A list asked for in two entries is merged by the API, but then its
     * fields are spread over several places. */
    it('asks for each list in a single entry', () => {
        const listNames = getDimensionMetadataFields().map(
            (entry) => entry.split('[')[0]
        )

        expect(new Set(listNames).size).toBe(listNames.length)
    })

    it('asks for the legend set with the data element', () => {
        expect(getDimensionMetadataFields()).toContain(
            'dataElementDimensions[dataElement[id,name],legendSet[id,name]]'
        )
    })
})
