import { useAppSelector, useMetadataStore } from '@hooks'
import {
    areVisualizationsEquivalent,
    isVisualizationEmpty,
} from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import { buildCurrentVisFromVisUiConfig } from '@store/thunks'
import { useMemo } from 'react'

export const useHasUnappliedChanges = (): boolean => {
    const currentVis = useAppSelector(getCurrentVis)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const metadataStore = useMetadataStore()

    return useMemo(() => {
        if (isVisualizationEmpty(currentVis)) {
            return false
        }

        return !areVisualizationsEquivalent(
            currentVis,
            buildCurrentVisFromVisUiConfig({
                previousCurrentVis: currentVis,
                visUiConfig,
                metadataStore,
            })
        )
    }, [currentVis, visUiConfig, metadataStore])
}
