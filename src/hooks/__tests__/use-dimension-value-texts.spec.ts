import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useAddMetadata, useDimensionValueTexts } from '@hooks'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

const orgUnit: LayoutDimension = {
    id: 'stg.ou',
    dimensionId: 'ou',
    dimensionType: 'ORGANISATION_UNIT',
    name: 'Org unit',
}
const itemIds = ['OU1', 'LEVEL-lvl1']
const conditions = {}
const formatValueOptions = {}

describe('useDimensionValueTexts', () => {
    it('swaps in names as their metadata arrives', async () => {
        const { result } = await renderHookWithAppWrapper(() => ({
            texts: useDimensionValueTexts({
                dimension: orgUnit,
                itemIds,
                conditions,
                formatValueOptions,
            }),
            addMetadata: useAddMetadata(),
        }))

        expect(result.current.texts).toEqual(['OU1', 'Levels: lvl1'])

        act(() => {
            result.current.addMetadata({ uid: 'OU1', name: 'Sierra Leone' })
            result.current.addMetadata({ uid: 'lvl1', name: 'National' })
        })

        expect(result.current.texts).toEqual([
            'Sierra Leone',
            'Levels: National',
        ])
    })
})
