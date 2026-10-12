import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import {
    getDimensionValueMetadataIds,
    getDimensionValueTexts,
} from '@modules/dimension/value-texts'
import { getStartEndDateFormatter } from '@modules/utils/dates'
import type { MetadataItem } from '@types'
import { describe, expect, it } from 'vitest'

const orgUnit: LayoutDimension = {
    id: 'stg.ou',
    dimensionId: 'ou',
    dimensionType: 'ORGANISATION_UNIT',
    name: 'Org unit',
}

const age: LayoutDimension = {
    id: 'stg.age',
    dimensionId: 'age',
    dimensionType: 'DATA_ELEMENT',
    valueType: 'INTEGER',
    name: 'Age',
}

const textsFor = (
    dimension: LayoutDimension,
    values: { itemIds?: string[]; condition?: string }
) =>
    getDimensionValueTexts({
        dimension,
        itemIds: values.itemIds ?? [],
        conditions: { condition: values.condition },
        metadataItems: {
            OU1: { id: 'OU1', name: 'Sierra Leone' } as MetadataItem,
        },
        formatValueOptions: {},
        formatStartEndDate: getStartEndDateFormatter('en'),
    })

describe('getDimensionValueTexts', () => {
    it('names the selected items of an item-based dimension', () => {
        expect(textsFor(orgUnit, { itemIds: ['OU1'] })).toEqual([
            'Sierra Leone',
        ])
    })

    it('ignores conditions on an item-based dimension', () => {
        expect(textsFor(orgUnit, { condition: 'GT:20' })).toEqual([])
    })

    it('describes the conditions of a value-based dimension', () => {
        const [text] = textsFor(age, { condition: 'GT:20' })

        expect(text).toContain('20')
    })

    it('ignores items on a value-based dimension', () => {
        expect(textsFor(age, { itemIds: ['OU1'] })).toEqual([])
    })
})

describe('getDimensionValueMetadataIds', () => {
    it('asks for the item names of an item-based dimension', () => {
        expect(
            getDimensionValueMetadataIds({
                dimension: orgUnit,
                itemIds: ['OU1', 'LEVEL-lvl1'],
                conditions: {},
            })
        ).toEqual(['OU1', 'lvl1'])
    })

    it('asks for the legend names of a grouped value-based dimension', () => {
        expect(
            getDimensionValueMetadataIds({
                dimension: age,
                itemIds: [],
                conditions: { legendSet: 'LS', condition: 'IN:L1;L2' },
            })
        ).toEqual(['L1', 'L2'])
    })
})
