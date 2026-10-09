import { getOutputTypeTooltipConfig } from '@components/layout-panel/bottom-bar/output-type-validity'
import { useAppSelector, useLayoutContext, useMetadataStore } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import { getCurrentVis } from '@store/current-vis-slice'
import { getVisUiConfigOutputType } from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import { useMemo } from 'react'
import type { ButtonAction } from './base-button'

export const useActionButton = (buttonType: OutputType) => {
    const currentVis = useAppSelector(getCurrentVis)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const { tetId, programIds } = useLayoutContext()
    const metadataStore = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)

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
            return 'update'
        } else {
            return 'switch'
        }
    }, [buttonType, currentVis, outputType])

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
