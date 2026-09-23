import {
    useAppSelector,
    useCrossTetMismatch,
    useLayoutContext,
    useMetadataStore,
} from '@hooks'
import {
    getCrossTetMessage,
    getDimensionLayoutBlockedMessage,
} from '@modules/dimension/blocking'
import { resolveDimensionTetId } from '@modules/layout'
import {
    getVisUiConfigCellValue,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

export const useDimensionLayoutBlockedMessage = (
    dimension: DimensionMetadataItem | undefined
): string | null => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const cellValue = useAppSelector(getVisUiConfigCellValue)
    const metadataStore = useMetadataStore()
    const { tetId: layoutTetId } = useLayoutContext()
    const mismatch = useCrossTetMismatch()
    if (!dimension) {
        return null
    }
    return getDimensionLayoutBlockedMessage({
        dimension,
        visualizationType,
        cellValueId: cellValue?.id ?? null,
        layoutTetId,
        dimensionTetId: resolveDimensionTetId(dimension, metadataStore),
        crossTetMessage: mismatch
            ? getCrossTetMessage(
                  mismatch.dataSourceTetName,
                  mismatch.layoutTetName
              )
            : '',
    })
}
