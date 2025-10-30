import queryString from 'query-string'
import type { FC } from 'react'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import { ModalDownloadDropdown } from '@components/download-menu/modal-download-dropdown'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { InterpretationModal as AnalyticsInterpretationModal } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getIsVisualizationLoading } from '@store/loader-slice'
import {
    getNavigationInterpretationId,
    setNavigationState,
} from '@store/navigation-slice'
import { getSavedVis } from '@store/saved-vis-slice'

type InterpretationModalProps = {
    onResponsesReceived: (metadata: MetadataInput) => void
}

export const InterpretationModal: FC<InterpretationModalProps> = ({
    onResponsesReceived,
}) => {
    const dispatch = useAppDispatch()
    const savedVis = useAppSelector(getSavedVis)
    const interpretationId = useAppSelector(getNavigationInterpretationId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    const queryParams = queryString.parse(location.search)
    console.log('query params', queryParams)
    const initialFocus = Boolean(queryParams.initialFocus)

    return interpretationId ? (
        <AnalyticsInterpretationModal
            interpretationId={interpretationId}
            visualization={savedVis}
            isVisualizationLoading={isVisualizationLoading}
            pluginComponent={PluginWrapper}
            downloadMenuComponent={ModalDownloadDropdown}
            initialFocus={initialFocus}
            onClose={() => {
                dispatch(
                    setNavigationState({
                        visualizationId: savedVis.id,
                        interpretationId: undefined,
                    })
                )
            }}
            onResponsesReceived={onResponsesReceived}
        />
    ) : null
}
