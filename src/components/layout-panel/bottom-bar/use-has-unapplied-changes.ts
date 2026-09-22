import { useAppSelector, useMetadataStore } from '@hooks'
import { buildCurrentVisFromVisUiConfig } from '@modules/visualization/current-vis'
import { areVisualizationsEquivalent } from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import { useMemo } from 'react'
import {
    getAvailableOutputTypes,
    getOutputTypeTooltipConfig,
} from './output-type-validity'

/**
 * Whether the visualization on screen differs from what visUiConfig describes
 * AND the user can do something about it.
 */
export const useHasUnappliedChanges = (): boolean => {
    const currentVis = useAppSelector(getCurrentVis)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const metadataStore = useMetadataStore()

    return useMemo(() => {
        const applicableOutputTypes = getAvailableOutputTypes(
            visUiConfig.visualizationType
        ).filter(
            (outputType) =>
                !getOutputTypeTooltipConfig({
                    outputType,
                    visUiConfig,
                    metadataStore,
                })
        )

        /* Nothing can be produced from this config, so there is no action to
         * hint at — every output type button is disabled. */
        if (!applicableOutputTypes.length) {
            return false
        }

        /* The selected output type was applicable when it was applied, so it
         * no longer being applicable means the config has changed. Applying
         * requires switching output type, which makes the result on screen
         * something other than what the config describes. */
        if (!applicableOutputTypes.includes(visUiConfig.outputType)) {
            return true
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
