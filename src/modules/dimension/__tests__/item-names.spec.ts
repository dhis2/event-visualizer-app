import {
    getItemDisplayNames,
    getItemMetadataIds,
} from '@modules/dimension/item-names'
import { getStartEndDateFormatter } from '@modules/utils/dates'
import type { MetadataItem } from '@types'
import { describe, expect, it } from 'vitest'

const formatStartEndDate = getStartEndDateFormatter('en')

const named = (names: Record<string, string>) =>
    Object.fromEntries(
        Object.entries(names).map(([id, name]) => [
            id,
            { id, name } as MetadataItem,
        ])
    )

describe('getItemMetadataIds', () => {
    it('strips level and group prefixes so the names can be looked up', () => {
        expect(
            getItemMetadataIds(['OU1', 'LEVEL-lvl1', 'OU_GROUP-grp1'])
        ).toEqual(['OU1', 'lvl1', 'grp1'])
    })
})

describe('getItemDisplayNames', () => {
    it('names items from the metadata', () => {
        expect(
            getItemDisplayNames({
                itemIds: ['OU1', 'OU2'],
                metadataItems: named({ OU1: 'Sierra Leone', OU2: 'Bo' }),
                formatStartEndDate,
            })
        ).toEqual(['Sierra Leone', 'Bo'])
    })

    it('shows the id of an item whose name has not loaded yet', () => {
        expect(
            getItemDisplayNames({
                itemIds: ['OU1'],
                metadataItems: {},
                formatStartEndDate,
            })
        ).toEqual(['OU1'])
    })

    it('collapses levels and groups into one entry each, after the items', () => {
        expect(
            getItemDisplayNames({
                itemIds: ['LEVEL-lvl1', 'OU1', 'OU_GROUP-grp1', 'LEVEL-lvl2'],
                metadataItems: named({
                    OU1: 'Sierra Leone',
                    lvl1: 'National',
                    lvl2: 'District',
                    grp1: 'Group One',
                }),
                formatStartEndDate,
            })
        ).toEqual([
            'Sierra Leone',
            'Levels: National, District',
            'Groups: Group One',
        ])
    })

    it('formats a custom start and end date', () => {
        expect(
            getItemDisplayNames({
                itemIds: ['2023-01-01_2023-12-31'],
                metadataItems: {},
                formatStartEndDate,
            })
        ).toEqual(['January 1, 2023 - December 31, 2023'])
    })
})
