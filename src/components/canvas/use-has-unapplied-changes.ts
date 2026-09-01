import { useAppSelector, useMetadataStore } from '@hooks'
import { logger } from '@modules/logger'
import { buildCurrentVisFromVisUiConfig } from '@modules/visualization/build'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import {
    areVisualizationsEquivalent,
    CUSTOM_VALUE_FIELDS,
} from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import { useMemo } from 'react'

export const useHasUnappliedChanges = (): boolean => {
    const currentVis = useAppSelector(getCurrentVis)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const metadataStore = useMetadataStore()

    return useMemo(() => {
        if (isVisualizationEmpty(currentVis)) {
            return false
        }

        try {
            return !areVisualizationsEquivalent(
                currentVis,
                buildCurrentVisFromVisUiConfig({
                    previousCurrentVis: currentVis,
                    visUiConfig,
                    metadataStore,
                }),
                { ignoredKeys: CUSTOM_VALUE_FIELDS }
            )
        } catch (error) {
            /* A config the builder can't turn into a visualization — an empty
             * layout, or a dimension whose metadata is missing — has nothing
             * to apply, which is what the disabled output type buttons already
             * tell the user. This runs on every canvas render, so throwing
             * here would take the whole app down instead. */
            logger.error(
                'Cannot build the visualization visUiConfig describes',
                error
            )
            return false
        }
    }, [currentVis, visUiConfig, metadataStore])
}
