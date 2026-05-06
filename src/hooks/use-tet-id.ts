import { useAppSelector, useMetadataStore } from '@hooks'
import { resolveTetId } from '@modules/layout'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'

export const useTetId = (): string | null => {
    const dimensionIds = useAppSelector(getVisUiConfigLayoutAllDimensionIds)
    const metadataStore = useMetadataStore()
    return resolveTetId(dimensionIds, metadataStore)
}
