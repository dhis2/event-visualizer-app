import { useAppSelector, useDimensionMetadataItems } from '@hooks'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useMemo } from 'react'

export type UseSelectedDimensionCountMatchFn = (
    item: DimensionMetadataItem
) => boolean

export const useSelectedDimensionCount = (
    matchFn: UseSelectedDimensionCountMatchFn
): number => {
    const selectedDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const selectedDimensions = useDimensionMetadataItems(selectedDimensionIds)
    const filteredSelectedDimensions = useMemo(
        () => Object.values(selectedDimensions).filter(matchFn),
        [selectedDimensions, matchFn]
    )

    return filteredSelectedDimensions.length
}
