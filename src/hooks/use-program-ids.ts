import { useAppSelector, useMetadataStore } from '@hooks'
import { resolveProgramIds } from '@modules/layout'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'

export const useProgramIds = (): string[] => {
    const dimensionIds = useAppSelector(getVisUiConfigLayoutAllDimensionIds)
    const metadataStore = useMetadataStore()
    return resolveProgramIds(dimensionIds, metadataStore)
}
