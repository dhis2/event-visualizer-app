import { getProgramFields, getTrackedEntityTypeFields } from '@modules/query'
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
