import { useMemo } from 'react'
import { isFetchEnabledByFilter } from '@components/main-sidebar/use-dimension-list'
import { useAppSelector } from '@hooks'
import { getFilter } from '@store/dimensions-selection-slice'
import type { DimensionMetadataItem, SingleQuery } from '@types'

export type UseIsDimensionListDisabledByFilterOptions = {
    initialDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
}

export const useIsDimensionListDisabledByFilter = ({
    initialDimensions,
    baseQuery,
}: UseIsDimensionListDisabledByFilterOptions): boolean => {
    const filter = useAppSelector(getFilter)
    return useMemo(() => {
        return (
            !isFetchEnabledByFilter(baseQuery, filter) &&
            !(
                Array.isArray(initialDimensions) &&
                initialDimensions.some(
                    (dimension) => dimension.dimensionType === filter
                )
            )
        )
    }, [initialDimensions, baseQuery, filter])
}
