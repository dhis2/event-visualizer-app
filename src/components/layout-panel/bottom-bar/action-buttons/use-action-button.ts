import { getOutputTypeTooltipConfig } from '@components/layout-panel/bottom-bar/output-type-validity'
import { useAppSelector, useLayoutContext, useMetadataStore } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import {
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import { useMemo } from 'react'
import type { ButtonAction } from './base-button'

/* The two table kinds that share the EVENT output type: a plain event table
 * and a custom value table. Used to label the EVENT/custom-value buttons. */
export type EventOutputTypeVariant = 'EVENT' | 'CUSTOM_VALUE'

export const useActionButton = (
    buttonType: OutputType,
    buttonVariant?: EventOutputTypeVariant
) => {
    const currentVis = useAppSelector(getCurrentVis)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const { tetId, programIds } = useLayoutContext()
    const metadataStore = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const firstProgramMetadata = useMemo(
        () =>
            programIds[0]
                ? metadataStore.getProgramMetadataItem(programIds[0])
                : undefined,
        [programIds, metadataStore]
    )

    const tetMetadata = useMemo(
        () => (tetId ? metadataStore.getMetadataItem(tetId) : undefined),
        [tetId, metadataStore]
    )

    const action = useMemo((): ButtonAction => {
        if (isVisualizationEmpty(currentVis)) {
            return 'create'
        } else if (outputType === buttonType) {
            if (
                visualizationType === 'PIVOT_TABLE' &&
                buttonType === 'EVENT' &&
                buttonVariant !== undefined
            ) {
                const hasCustomValue = Boolean(currentVis.value?.id)
                const activeVariant: EventOutputTypeVariant = hasCustomValue
                    ? 'CUSTOM_VALUE'
                    : 'EVENT'
                return activeVariant === buttonVariant ? 'update' : 'switch'
            }
            return 'update'
        } else {
            return 'switch'
        }
    }, [buttonType, buttonVariant, currentVis, outputType, visualizationType])

    const tooltipConfig = useMemo(
        () =>
            getOutputTypeTooltipConfig({
                outputType: buttonType,
                visUiConfig,
                metadataStore,
            }),
        [buttonType, visUiConfig, metadataStore]
    )

    const dataSourceMetadata =
        buttonType === 'TRACKED_ENTITY_INSTANCE'
            ? tetMetadata
            : firstProgramMetadata

    return {
        action,
        dataSourceMetadata,
        tooltipConfig,
    }
}
