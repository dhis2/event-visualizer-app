import { useAppSelector, useMetadataStore } from '@hooks'
import { resolveProgramStageIds } from '@modules/layout'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'

export const useProgramStageIds = (): string[] => {
    const dimensionIds = useAppSelector(getVisUiConfigLayoutAllDimensionIds)
    const metadataStore = useMetadataStore()
    return resolveProgramStageIds(dimensionIds, metadataStore)
}
