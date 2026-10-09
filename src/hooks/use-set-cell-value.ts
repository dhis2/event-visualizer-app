import { useAppDispatch } from '@hooks'
import { setVisUiConfigCellValue } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { useCallback } from 'react'

/* Taking a dimension as the cell value, from wherever the user asked for it.
 * Always a clone: the dimension stays in any axis it already occupies.
 * `DEFAULT` rather than the item's concrete type, so the menu can tell an
 * untouched cell value from one explicitly set to that same type. */
export const useSetCellValue = (): ((
    dimension: DimensionMetadataItem
) => void) => {
    const dispatch = useAppDispatch()

    return useCallback(
        (dimension: DimensionMetadataItem) => {
            dispatch(
                setVisUiConfigCellValue({
                    id: dimension.id,
                    aggregationType: 'DEFAULT',
                })
            )
        },
        [dispatch]
    )
}
