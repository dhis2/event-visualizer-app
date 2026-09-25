import { useAppSelector } from '@hooks'
import { resolveId } from '@modules/dimension/ids'
import { createSelector } from '@reduxjs/toolkit'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigLayoutAllDimensionIds,
} from '@store/vis-ui-config-slice'

/* The cell value is one more place a dimension can be used, so it counts as
 * in the layout for the sidebar. */
const selectAllLayoutDimensionsLookup = createSelector(
    getVisUiConfigLayoutAllDimensionIds,
    getVisUiConfigCustomValue,
    (ids, customValue) =>
        new Set((customValue ? [...ids, customValue.id] : ids).map(resolveId))
)

export const useIsDimensionInLayout = (id: string | undefined) => {
    const lookup = useAppSelector(selectAllLayoutDimensionsLookup)
    return typeof id === 'string' && lookup.has(id)
}
