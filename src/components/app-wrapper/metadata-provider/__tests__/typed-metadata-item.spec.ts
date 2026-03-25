import { expect, describe, it } from 'vitest'
import { assertTypedMetadataItem } from '../typed-metadata-item'
import {
    isDimensionMetadataItem,
    isOrganisationUnitMetadataItem,
} from '@modules/metadata'
import type {
    DimensionMetadataItem,
    OrganisationUnitMetadataItem,
} from '@types'

const dimension: DimensionMetadataItem = {
    id: 'weight',
    dimensionId: 'weight',
    name: 'Weight',
    dimensionType: 'DATA_ELEMENT',
}

const orgUnit: OrganisationUnitMetadataItem = {
    id: 'ou1',
    name: 'Sierra Leone',
    path: '/ou1',
}

describe('assertTypedMetadataItem', () => {
    it('returns the item when it passes the guard', () => {
        const result = assertTypedMetadataItem(
            dimension,
            isDimensionMetadataItem,
            'Item is not a dimension'
        )
        expect(result).toBe(dimension)
    })

    it('returns undefined when item is undefined', () => {
        const result = assertTypedMetadataItem(
            undefined,
            isDimensionMetadataItem,
            'Item is not a dimension'
        )
        expect(result).toBeUndefined()
    })

    it('throws when item is present but fails the guard', () => {
        expect(() =>
            assertTypedMetadataItem(
                orgUnit,
                isDimensionMetadataItem,
                'Item is not a dimension'
            )
        ).toThrow('Item is not a dimension')
    })

    it('throws with the exact provided error message', () => {
        expect(() =>
            assertTypedMetadataItem(
                dimension,
                isOrganisationUnitMetadataItem,
                'Item is not an organisation unit'
            )
        ).toThrow('Item is not an organisation unit')
    })
})
