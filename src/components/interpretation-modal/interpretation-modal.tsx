import type { FC } from 'react'
import {
    useInterpretationModalState,
    useInterpretationModalTogglers,
} from '@components/app-wrapper/interpretations-provider'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import { ModalDownloadDropdown } from '@components/download-menu/modal-download-dropdown'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { InterpretationModal as AnalyticsInterpretationModal } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getSavedVis } from '@store/saved-vis-slice'

export const InterpretationModal: FC = () => {
    const savedVis = useAppSelector(getSavedVis)
    const { interpretationId, initialFocus } = useInterpretationModalState()
    const { onCloseInterpretationModal } = useInterpretationModalTogglers()
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    // No need to store metadata from the interpretaion modal analytics response
    // The metadata is not accessed by the plugin anyway
    const noop: (metadata: MetadataInput) => void = () => {}

    return interpretationId ? (
        <AnalyticsInterpretationModal
            interpretationId={interpretationId}
            visualization={savedVis}
            isVisualizationLoading={isVisualizationLoading}
            pluginComponent={PluginWrapper}
            downloadMenuComponent={ModalDownloadDropdown}
            initialFocus={initialFocus}
            onClose={onCloseInterpretationModal}
            onResponsesReceived={noop}
        />
    ) : null
}
