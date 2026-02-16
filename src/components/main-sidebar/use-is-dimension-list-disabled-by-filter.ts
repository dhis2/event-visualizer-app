import { useMemo } from 'react'
import { isFetchEnabledByFilter } from '@components/main-sidebar/use-dimension-list'
import { useAppSelector } from '@hooks'
import { getFilter } from '@store/dimensions-selection-slice'
import type { DimensionMetadataItem, SingleQuery } from '@types'

export type UseIsDimensionListDisabledByFilterOptions = {
    fixedDimensions?: DimensionMetadataItem[]
    baseQuery?: SingleQuery
}

export const useIsDimensionListDisabledByFilter = ({
    fixedDimensions,
    baseQuery,
}: UseIsDimensionListDisabledByFilterOptions): boolean => {
    const filter = useAppSelector(getFilter)
    return useMemo(() => {
        return (
            !isFetchEnabledByFilter(baseQuery, filter) &&
            !(
                Array.isArray(fixedDimensions) &&
                fixedDimensions.some(
                    (dimension) => dimension.dimensionType === filter
                )
            )
        )
    }, [fixedDimensions, baseQuery, filter])
}
