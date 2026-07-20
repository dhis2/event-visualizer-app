import { useAppSelector, useLayoutContext, useMetadataItem } from '@hooks'
import { getDataSourceTet } from '@modules/data-source'
import { getDataSourceId } from '@store/dimensions-selection-slice'

export type CrossTetMismatch = {
    dataSourceTetName: string
    layoutTetName: string
    layoutTetId: string
}

/* Dimensions from different tracked entity types cannot coexist in one layout.
 * Returns the conflicting TET names when the current data source's TET differs
 * from the TET already established by the layout, else null. */
export const useCrossTetMismatch = (): CrossTetMismatch | null => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSource = useMetadataItem(dataSourceId)
    const dataSourceTet = getDataSourceTet(dataSource)
    const { tetId: layoutTetId } = useLayoutContext()
    const layoutTet = useMetadataItem(layoutTetId)
    if (!dataSourceTet || !layoutTet || dataSourceTet.id === layoutTet.id) {
        return null
    }
    return {
        dataSourceTetName: dataSourceTet.name,
        layoutTetName: layoutTet.name,
        layoutTetId: layoutTet.id,
    }
}
