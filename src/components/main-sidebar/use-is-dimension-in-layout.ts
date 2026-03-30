import { createSelector } from '@reduxjs/toolkit'
import { resolveId } from '@components/app-wrapper/metadata-provider/dimension'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'

const selectAllLayoutDimensionsLookup = createSelector(
    getVisUiConfigLayoutAllDimensionIds,
    (ids) => new Set(ids.map(resolveId))
)

export const useIsDimensionInLayout = (id: string | undefined) => {
    const lookup = useAppSelector(selectAllLayoutDimensionsLookup)
    return typeof id === 'string' && lookup.has(id)
}
