import { describe, it, expect } from 'vitest'
import { getLayoutDimensions } from '../get-layout-dimensions'

describe('getLayoutDimensions for data elements', () => {
    const metadata = {
        p1: {
            id: 'p1',
            name: 'Program1',
        },
        p2: {
            id: 'p2',
            name: 'Program2',
        },
        p1s1: {
            id: 'p1s1',
            name: 'P1 Stage1',
        },
        p1s2: {
            id: 'p1s2',
            name: 'P1 Stage2',
        },
        p2s1: {
            id: 'p2s1',
            name: 'P2 Stage1',
        },
        p2s2: {
            id: 'p2s2',
            name: 'P2 Stage2',
        },
        'p1s1.d1': {
            id: 'p1s1.d1',
            name: 'Dimension1',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet1',
            valueType: 'TEXT',
        },
        'p1s1.d2': {
            id: 'p1s1.d2',
            name: 'Dimension2',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet2',
            valueType: 'TEXT',
        },
        'p1s2.d1': {
            id: 'p1s2.d1',
            name: 'Dimension1',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet1',
            valueType: 'TEXT',
        },
        'p1s2.d2': {
            id: 'p1s2.d2',
            name: 'Dimension2',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet2',
            valueType: 'TEXT',
        },
        'p1s2.d3': {
            id: 'p1s2.d3',
            name: 'Dimension3',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet3',
            valueType: 'TEXT',
        },
        'p1.p1s1.d1': {
            id: 'p1.p1s1.d1',
            name: 'Dimension1',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet1',
            valueType: 'TEXT',
        },
        'p1.p1s2.d1': {
            id: 'p1.p1s2.d1',
            name: 'Dimension1',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet1',
            valueType: 'TEXT',
        },
        'p1.p1s2.d2': {
            id: 'p1.p1s2.d2',
            name: 'Dimension2',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet2',
            valueType: 'TEXT',
        },
        'p2.p2s1.d1': {
            id: 'p2.p2s1.d1',
            name: 'Dimension1',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet1',
            valueType: 'TEXT',
        },
        'p2.p2s1.d3': {
            id: 'p2.p2s1.d3',
            name: 'Dimension3',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet3',
            valueType: 'TEXT',
        },
        'p2.p2s2.d1': {
            id: 'p2.p2s2.d1',
            name: 'Dimension1',
            dimensionType: 'DATA_ELEMENT',
            optionSet: 'OptionSet1',
            valueType: 'TEXT',
        },
    }
    it('returns correct result for: non-TE, no duplicates -> no suffix', () => {
        const id1 = 'p1s1.d1',
            id2 = 'p1s1.d2',
            id3 = 'p1s2.d3'
        const dimensionIds = [id1, id2, id3]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Dimension1')
        expect(output[0].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[0].optionSet).toEqual('OptionSet1')
        expect(output[0].valueType).toEqual('TEXT')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Dimension2')
        expect(output[1].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[1].optionSet).toEqual('OptionSet2')
        expect(output[1].valueType).toEqual('TEXT')
        expect(output[1].suffix).toBeUndefined()

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Dimension3')
        expect(output[2].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[2].optionSet).toEqual('OptionSet3')
        expect(output[2].valueType).toEqual('TEXT')
        expect(output[2].suffix).toBeUndefined()
    })

    it('returns correct result for: non-TE, with duplicates per stage -> stage suffix', () => {
        const id1 = 'p1s1.d1',
            id2 = 'p1s2.d1'
        const dimensionIds = [id1, id2]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Dimension1')
        expect(output[0].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[0].optionSet).toEqual('OptionSet1')
        expect(output[0].valueType).toEqual('TEXT')
        expect(output[0].suffix).toEqual('P1 Stage1')

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Dimension1')
        expect(output[1].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[1].optionSet).toEqual('OptionSet1')
        expect(output[1].valueType).toEqual('TEXT')
        expect(output[1].suffix).toEqual('P1 Stage2')
    })

    it('returns correct result for: TE, no duplicates -> no suffix', () => {
        const id1 = 'p1.p1s1.d1',
            id2 = 'p1.p1s2.d2',
            id3 = 'p2.p2s1.d3'
        const dimensionIds = [id1, id2, id3]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'TRACKED_ENTITY_INSTANCE',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Dimension1')
        expect(output[0].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[0].optionSet).toEqual('OptionSet1')
        expect(output[0].valueType).toEqual('TEXT')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Dimension2')
        expect(output[1].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[1].optionSet).toEqual('OptionSet2')
        expect(output[1].valueType).toEqual('TEXT')
        expect(output[1].suffix).toBeUndefined()

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Dimension3')
        expect(output[2].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[2].optionSet).toEqual('OptionSet3')
        expect(output[2].valueType).toEqual('TEXT')
        expect(output[2].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, with duplicates per stage -> stage suffix', () => {
        const id1 = 'p1.p1s1.d1',
            id2 = 'p1.p1s2.d1',
            id3 = 'p1.p1s2.d2' // no duplicate, just reference
        const dimensionIds = [id1, id2, id3]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Dimension1')
        expect(output[0].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[0].optionSet).toEqual('OptionSet1')
        expect(output[0].valueType).toEqual('TEXT')
        expect(output[0].suffix).toEqual('P1 Stage1')

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Dimension1')
        expect(output[1].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[1].optionSet).toEqual('OptionSet1')
        expect(output[1].valueType).toEqual('TEXT')
        expect(output[1].suffix).toEqual('P1 Stage2')

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Dimension2')
        expect(output[2].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[2].optionSet).toEqual('OptionSet2')
        expect(output[2].valueType).toEqual('TEXT')
        expect(output[2].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, with duplicates per program -> program suffix', () => {
        const id1 = 'p1.p1s1.d1',
            id2 = 'p2.p2s1.d1',
            id3 = 'p1.p1s2.d2' // no duplicate, just reference
        const dimensionIds = [id1, id2, id3]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Dimension1')
        expect(output[0].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[0].optionSet).toEqual('OptionSet1')
        expect(output[0].valueType).toEqual('TEXT')
        expect(output[0].suffix).toEqual('Program1')

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Dimension1')
        expect(output[1].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[1].optionSet).toEqual('OptionSet1')
        expect(output[1].valueType).toEqual('TEXT')
        expect(output[1].suffix).toEqual('Program2')

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Dimension2')
        expect(output[2].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[2].optionSet).toEqual('OptionSet2')
        expect(output[2].valueType).toEqual('TEXT')
        expect(output[2].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, with duplicates per program and stage -> stage suffix', () => {
        const id1 = 'p1.p1s1.d1', // stage duplicate of id3
            id2 = 'p1.p1s2.d1', // stage duplicate of id1
            id3 = 'p2.p2s1.d1', // program duplicate of id1 and id3
            id4 = 'p1.p1s2.d2' // no duplicate, just reference
        const dimensionIds = [id1, id2, id3, id4]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Dimension1')
        expect(output[0].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[0].optionSet).toEqual('OptionSet1')
        expect(output[0].valueType).toEqual('TEXT')
        expect(output[0].suffix).toEqual('P1 Stage1')

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Dimension1')
        expect(output[1].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[1].optionSet).toEqual('OptionSet1')
        expect(output[1].valueType).toEqual('TEXT')
        expect(output[1].suffix).toEqual('P1 Stage2')

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Dimension1')
        expect(output[2].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[2].optionSet).toEqual('OptionSet1')
        expect(output[2].valueType).toEqual('TEXT')
        expect(output[2].suffix).toEqual('P2 Stage1')

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Dimension2')
        expect(output[3].dimensionType).toEqual('DATA_ELEMENT')
        expect(output[3].optionSet).toEqual('OptionSet2')
        expect(output[3].valueType).toEqual('TEXT')
        expect(output[3].suffix).toBeUndefined()
    })
})

describe('getLayoutDimensions for time dimensions', () => {
    const metadata = {
        p1: {
            id: 'p1',
            name: 'Program1',
        },
        p2: {
            id: 'p2',
            name: 'Program2',
        },
        enrollmentDate: {
            id: 'enrollmentDate',
            name: 'Date of enrollment',
            dimensionType: 'PERIOD',
        },
        eventDate: {
            id: 'eventDate',
            name: 'Event date',
            dimensionType: 'PERIOD',
        },
        incidentDate: {
            id: 'incidentDate',
            name: 'Incident date',
            dimensionType: 'PERIOD',
        },
        scheduledDate: {
            id: 'scheduledDate',
            name: 'Scheduled date',
            dimensionType: 'PERIOD',
        },
        'p1.enrollmentDate': {
            id: 'p1.enrollmentDate',
            name: 'Date of enrollment',
            dimensionType: 'PERIOD',
        },
        'p1.eventDate': {
            id: 'p1.eventDate',
            name: 'Event date',
            dimensionType: 'PERIOD',
        },
        'p1.incidentDate': {
            id: 'p1.incidentDate',
            name: 'Incident date',
            dimensionType: 'PERIOD',
        },
        'p1.scheduledDate': {
            id: 'p1.scheduledDate',
            name: 'Scheduled date',
            dimensionType: 'PERIOD',
        },
        'p2.enrollmentDate': {
            id: 'p2.enrollmentDate',
            name: 'Date of enrollment',
            dimensionType: 'PERIOD',
        },
        'p2.eventDate': {
            id: 'p2.eventDate',
            name: 'Event date',
            dimensionType: 'PERIOD',
        },
        'p2.incidentDate': {
            id: 'p2.incidentDate',
            name: 'Incident date',
            dimensionType: 'PERIOD',
        },
        'p2.scheduledDate': {
            id: 'p2.scheduledDate',
            name: 'Scheduled date',
            dimensionType: 'PERIOD',
        },
        lastUpdated: {
            id: 'lastUpdated',
            name: 'Last updated on',
            dimensionType: 'PERIOD',
        },
    }

    it('returns correct result for: non-TE, no duplicates -> no suffix', () => {
        const id1 = 'eventDate',
            id2 = 'enrollmentDate',
            id3 = 'incidentDate',
            id4 = 'scheduledDate',
            id5 = 'lastUpdated'
        const dimensionIds = [id1, id2, id3, id4, id5]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Event date')
        expect(output[0].dimensionType).toEqual('PERIOD')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Date of enrollment')
        expect(output[1].dimensionType).toEqual('PERIOD')
        expect(output[1].suffix).toBeUndefined()

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Incident date')
        expect(output[2].dimensionType).toEqual('PERIOD')
        expect(output[2].suffix).toBeUndefined()

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Scheduled date')
        expect(output[3].dimensionType).toEqual('PERIOD')
        expect(output[3].suffix).toBeUndefined()

        expect(output[4].id).toEqual(id5)
        expect(output[4].name).toEqual('Last updated on')
        expect(output[4].dimensionType).toEqual('PERIOD')
        expect(output[4].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, no duplicates -> no suffix', () => {
        const id1 = 'p1.eventDate',
            id2 = 'p1.enrollmentDate',
            id3 = 'p1.incidentDate',
            id4 = 'p1.scheduledDate',
            id5 = 'lastUpdated'
        const dimensionIds = [id1, id2, id3, id4, id5]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'TRACKED_ENTITY_INSTANCE',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Event date')
        expect(output[0].dimensionType).toEqual('PERIOD')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Date of enrollment')
        expect(output[1].dimensionType).toEqual('PERIOD')
        expect(output[1].suffix).toBeUndefined()

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Incident date')
        expect(output[2].dimensionType).toEqual('PERIOD')
        expect(output[2].suffix).toBeUndefined()

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Scheduled date')
        expect(output[3].dimensionType).toEqual('PERIOD')
        expect(output[3].suffix).toBeUndefined()

        expect(output[4].id).toEqual(id5)
        expect(output[4].name).toEqual('Last updated on')
        expect(output[4].dimensionType).toEqual('PERIOD')
        expect(output[4].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, duplicates -> program suffix', () => {
        const id1 = 'p1.eventDate',
            id2 = 'p1.enrollmentDate',
            id3 = 'p1.incidentDate',
            id4 = 'p1.scheduledDate',
            id5 = 'p2.eventDate',
            id6 = 'p2.enrollmentDate',
            id7 = 'p2.incidentDate',
            id8 = 'p2.scheduledDate',
            id9 = 'lastUpdated'
        const dimensionIds = [id1, id2, id3, id4, id5, id6, id7, id8, id9]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'TRACKED_ENTITY_INSTANCE',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Event date')
        expect(output[0].dimensionType).toEqual('PERIOD')
        expect(output[0].suffix).toEqual('Program1')

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Date of enrollment')
        expect(output[1].dimensionType).toEqual('PERIOD')
        expect(output[1].suffix).toEqual('Program1')

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Incident date')
        expect(output[2].dimensionType).toEqual('PERIOD')
        expect(output[2].suffix).toEqual('Program1')

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Scheduled date')
        expect(output[3].dimensionType).toEqual('PERIOD')
        expect(output[3].suffix).toEqual('Program1')

        expect(output[4].id).toEqual(id5)
        expect(output[4].name).toEqual('Event date')
        expect(output[4].dimensionType).toEqual('PERIOD')
        expect(output[4].suffix).toEqual('Program2')

        expect(output[5].id).toEqual(id6)
        expect(output[5].name).toEqual('Date of enrollment')
        expect(output[5].dimensionType).toEqual('PERIOD')
        expect(output[5].suffix).toEqual('Program2')

        expect(output[6].id).toEqual(id7)
        expect(output[6].name).toEqual('Incident date')
        expect(output[6].dimensionType).toEqual('PERIOD')
        expect(output[6].suffix).toEqual('Program2')

        expect(output[7].id).toEqual(id8)
        expect(output[7].name).toEqual('Scheduled date')
        expect(output[7].dimensionType).toEqual('PERIOD')
        expect(output[7].suffix).toEqual('Program2')

        expect(output[8].id).toEqual(id9)
        expect(output[8].name).toEqual('Last updated on')
        expect(output[8].dimensionType).toEqual('PERIOD')
        expect(output[8].suffix).toBeUndefined()
    })
})

describe('getLayoutDimensions for program dimensions', () => {
    const metadata = {
        p1: {
            id: 'p1',
            name: 'Program1',
        },
        p2: {
            id: 'p2',
            name: 'Program2',
        },
        ou: {
            id: 'ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
        'p1.ou': {
            id: 'p1.ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
        'p2.ou': {
            id: 'p2.ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
        eventStatus: {
            id: 'eventStatus',
            dimensionType: 'STATUS',
            name: 'Event status',
        },
        programStatus: {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
        },
        'p1.eventStatus': {
            id: 'p1.eventStatus',
            dimensionType: 'STATUS',
            name: 'Event status',
        },
        'p1.programStatus': {
            id: 'p1.programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
        },
        'p2.eventStatus': {
            id: 'p2.eventStatus',
            dimensionType: 'STATUS',
            name: 'Event status',
        },
        'p2.programStatus': {
            id: 'p2.programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
        },
        XYZ123: {
            aggregationType: 'NONE',
            dimensionItemType: 'DATA_ELEMENT',
            name: 'Some data element',
            totalAggregationType: 'SUM',
            uid: 'XYZ123',
            valueType: 'TEXT',
        },
        'p1.p1s1.XYZ123': {
            aggregationType: 'NONE',
            dimensionItemType: 'DATA_ELEMENT',
            name: 'Some data element 1',
            totalAggregationType: 'SUM',
            uid: 'XYZ123',
            valueType: 'TEXT',
        },
        'p2.p2s1.XYZ123': {
            aggregationType: 'NONE',
            dimensionItemType: 'DATA_ELEMENT',
            name: 'Some data element 2',
            totalAggregationType: 'SUM',
            uid: 'XYZ123',
            valueType: 'TEXT',
        },
    }

    it('returns correct result for: non-TE, no duplicates -> no suffix', () => {
        const id1 = 'ou',
            id2 = 'eventStatus',
            id3 = 'programStatus',
            id4 = 'p1.p1s1.XYZ123'
        const dimensionIds = [id1, id2, id3, id4]
        const getMetadataItem = (id: string) => metadata[id]
        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'ENROLLMENT',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Organisation unit')
        expect(output[0].dimensionType).toEqual('ORGANISATION_UNIT')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Event status')
        expect(output[1].dimensionType).toEqual('STATUS')
        expect(output[1].suffix).toBeUndefined()

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Program status')
        expect(output[2].dimensionType).toEqual('STATUS')
        expect(output[2].suffix).toBeUndefined()

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Some data element 1')
        expect(output[3].dimensionType).toBeUndefined()
        expect(output[3].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, no duplicates -> program suffix for ou and statuses', () => {
        const id1 = 'ou',
            id2 = 'p1.ou',
            id3 = 'p1.eventStatus',
            id4 = 'p1.programStatus',
            id5 = 'p1.p1s1.XYZ123'
        const dimensionIds = [id1, id2, id3, id4, id5]

        metadata.ou.name = 'Registration org. unit'

        const getMetadataItem = (id: string) => metadata[id]

        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'TRACKED_ENTITY_INSTANCE',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Registration org. unit')
        expect(output[0].dimensionType).toEqual('ORGANISATION_UNIT')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Organisation unit')
        expect(output[1].dimensionType).toEqual('ORGANISATION_UNIT')
        expect(output[1].suffix).toEqual('Program1')

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Event status')
        expect(output[2].dimensionType).toEqual('STATUS')
        expect(output[2].suffix).toEqual('Program1')

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Program status')
        expect(output[3].dimensionType).toEqual('STATUS')
        expect(output[3].suffix).toEqual('Program1')

        expect(output[4].id).toEqual(id5)
        expect(output[4].name).toEqual('Some data element 1')
        expect(output[4].dimensionType).toBeUndefined()
        expect(output[4].suffix).toBeUndefined()
    })

    it('returns correct result for: TE, duplicates -> program suffix', () => {
        const id1 = 'ou',
            id2 = 'p1.ou',
            id3 = 'p2.ou',
            id4 = 'p1.eventStatus',
            id5 = 'p2.eventStatus',
            id6 = 'p1.programStatus',
            id7 = 'p2.programStatus',
            id8 = 'p1.p1s1.XYZ123',
            id9 = 'p2.p2s1.XYZ123'
        const dimensionIds = [id1, id2, id3, id4, id5, id6, id7, id8, id9]

        metadata.ou.name = 'Registration org. unit'

        const getMetadataItem = (id: string) => metadata[id]

        const output = getLayoutDimensions({
            dimensionIds,
            inputType: 'TRACKED_ENTITY_INSTANCE',
            getMetadataItem,
        })

        expect(output[0].id).toEqual(id1)
        expect(output[0].name).toEqual('Registration org. unit')
        expect(output[0].dimensionType).toEqual('ORGANISATION_UNIT')
        expect(output[0].suffix).toBeUndefined()

        expect(output[1].id).toEqual(id2)
        expect(output[1].name).toEqual('Organisation unit')
        expect(output[1].dimensionType).toEqual('ORGANISATION_UNIT')
        expect(output[1].suffix).toEqual('Program1')

        expect(output[2].id).toEqual(id3)
        expect(output[2].name).toEqual('Organisation unit')
        expect(output[2].dimensionType).toEqual('ORGANISATION_UNIT')
        expect(output[2].suffix).toEqual('Program2')

        expect(output[3].id).toEqual(id4)
        expect(output[3].name).toEqual('Event status')
        expect(output[3].dimensionType).toEqual('STATUS')
        expect(output[3].suffix).toEqual('Program1')

        expect(output[4].id).toEqual(id5)
        expect(output[4].name).toEqual('Event status')
        expect(output[4].dimensionType).toEqual('STATUS')
        expect(output[4].suffix).toEqual('Program2')

        expect(output[5].id).toEqual(id6)
        expect(output[5].name).toEqual('Program status')
        expect(output[5].dimensionType).toEqual('STATUS')
        expect(output[5].suffix).toEqual('Program1')

        expect(output[6].id).toEqual(id7)
        expect(output[6].name).toEqual('Program status')
        expect(output[6].dimensionType).toEqual('STATUS')
        expect(output[6].suffix).toEqual('Program2')

        expect(output[7].id).toEqual(id8)
        expect(output[7].name).toEqual('Some data element 1')
        expect(output[7].dimensionType).toBeUndefined()
        expect(output[7].suffix).toEqual('Program1')

        expect(output[8].id).toEqual(id9)
        expect(output[8].name).toEqual('Some data element 2')
        expect(output[8].dimensionType).toBeUndefined()
        expect(output[8].suffix).toEqual('Program2')
    })
})
