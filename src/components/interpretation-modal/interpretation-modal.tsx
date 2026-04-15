import {
    useInterpretationModalState,
    useInterpretationModalTogglers,
} from '@components/app-wrapper/interpretations-provider'
import { ModalDownloadDropdown } from '@components/download-menu/modal-download-dropdown'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { InterpretationModal as AnalyticsInterpretationModal } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { isVisualizationSaved } from '@modules/visualization'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import type { MetadataInput } from '@types'
import type { FC } from 'react'

// The onResponsesReceived prop is required in the analytics component but there is
// no need to store metadata from the interpretation modal analytics response when viewing an interpretation.
// The metadata is not accessed by the plugin anyway.
// This is a noop.
const onResponsesReceivedNoop: (metadata: MetadataInput) => void = () => {}

export const InterpretationModal: FC = () => {
    const savedVis = useAppSelector(getSavedVis)
    const { interpretationId, initialFocus } = useInterpretationModalState()
    const { onCloseInterpretationModal } = useInterpretationModalTogglers()
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    // The interpretation modal only makes sense for an already-saved vis;
    // if none is loaded we don't render it.
    if (!interpretationId || !isVisualizationSaved(savedVis)) {
        return null
    }

    return (
        <AnalyticsInterpretationModal
            interpretationId={interpretationId}
            visualization={savedVis}
            isVisualizationLoading={isVisualizationLoading}
            pluginComponent={PluginWrapper}
            downloadMenuComponent={ModalDownloadDropdown}
            initialFocus={initialFocus}
            onClose={onCloseInterpretationModal}
            onResponsesReceived={onResponsesReceivedNoop}
        />
    )
}
