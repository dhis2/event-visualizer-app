import { useContext, useMemo } from 'react'
import { DimensionCardsContext } from './dimension-cards-context'
import type { DimensionMetadataItem } from '@types'

export type UseSelectedDimensionCountMatchFn = (
    item: DimensionMetadataItem
) => boolean

export const useSelectedDimensionCount = (
    matchFn: UseSelectedDimensionCountMatchFn
): number => {
    const { selectedDimensions } = useContext(DimensionCardsContext)
    return useMemo(
        () => selectedDimensions.filter(matchFn).length,
        [selectedDimensions, matchFn]
    )
}
