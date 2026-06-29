import {
    useAppSelector,
    useCrossTetMismatch,
    useMetadataStore,
    useTetId,
} from '@hooks'
import {
    getCrossTetMessage,
    getDimensionLayoutBlockedMessage,
} from '@modules/dimension'
import { resolveDimensionTetId } from '@modules/layout'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

export const useDimensionLayoutBlockedMessage = (
    dimension: DimensionMetadataItem | undefined
): string | null => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const metadataStore = useMetadataStore()
    const layoutTetId = useTetId()
    const mismatch = useCrossTetMismatch()
    if (!dimension) {
        return null
    }
    return getDimensionLayoutBlockedMessage({
        dimension,
        visualizationType,
        customValueId: customValue?.id ?? null,
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
