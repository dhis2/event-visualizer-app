import { useMemo } from 'react'
import { useAppSelector, useMetadataItems } from '@hooks'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

export type UseSelectedDimensionCountMatchFn = (
    item: DimensionMetadataItem
) => boolean

export const useSelectedDimensionCount = (
    matchFn: UseSelectedDimensionCountMatchFn
): number => {
    const selectedDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const selectedDimensions = useMetadataItems(selectedDimensionIds)
    const filteredSelectedDimensions = useMemo(
        () => Object.values(selectedDimensions).filter(matchFn),
        [selectedDimensions, matchFn]
    )

    return filteredSelectedDimensions.length
}
