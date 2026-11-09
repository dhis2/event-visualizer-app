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
        const listNames = getDimensionMetadataFields('displayName').map(
            (entry) => entry.split('[')[0]
        )

        expect(new Set(listNames).size).toBe(listNames.length)
    })

    it("asks for a data element's and an attribute's own aggregation type", () => {
        expect(getDimensionMetadataFields('displayName')).toContain(
            'attributeDimensions[attribute[id,displayName~rename(name),valueType,aggregationType]]'
        )
    })

    it('names the items by the display property', () => {
        expect(getDimensionMetadataFields('displayShortName')).toContain(
            'programIndicatorDimensions[programIndicator[id,displayShortName~rename(name)]]'
        )
    })

    /* A legend set has no shortName. */
    it('asks for the legend set with the data element, by its display name', () => {
        expect(getDimensionMetadataFields('displayShortName')).toContain(
            'dataElementDimensions[dataElement[id,displayShortName~rename(name),valueType,aggregationType],legendSet[id,displayName~rename(name)]]'
        )
    })
})
