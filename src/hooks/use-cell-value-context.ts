import { useAppSelector, useMetadataStore } from '@hooks'
import { resolveCellValueContext, type LayoutContext } from '@modules/layout'
import { getVisUiConfigCellValue } from '@store/vis-ui-config-slice'
import { useMemo } from 'react'

/* The program, stage and tracked entity type the cell value references. Kept
 * apart from the layout context because the cell value is not a layout
 * dimension: only the output type validation unions the two, while chips, the
 * sidebar and layout emptiness must keep ignoring it. */
export const useCellValueContext = (): LayoutContext => {
    const cellValue = useAppSelector(getVisUiConfigCellValue)
    const metadataStore = useMetadataStore()

    return useMemo(
        () => resolveCellValueContext(cellValue?.id, metadataStore),
        [cellValue?.id, metadataStore]
    )
}
