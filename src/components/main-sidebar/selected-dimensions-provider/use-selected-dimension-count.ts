import { useContext, useMemo } from 'react'
import { SelectedDimensionsContext } from './selected-dimensions-context'
import type { DimensionMetadataItem } from '@types'

export type UseSelectedDimensionCountMatchFn = (
    item: DimensionMetadataItem
) => boolean

export const useSelectedDimensionCount = (
    matchFn: UseSelectedDimensionCountMatchFn
): number => {
    const { selectedDimensions } = useContext(SelectedDimensionsContext)
    return useMemo(
        () => selectedDimensions.filter(matchFn).length,
        [selectedDimensions, matchFn]
    )
}
