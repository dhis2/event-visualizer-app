import type { FC } from 'react'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import type { CurrentVisualization } from '@types'

type InterpretationModalProps = {
    interpretationId: string
    isVisualizationLoading: boolean
    pluginComponent: object | (() => void)
    visualization: CurrentVisualization
    onClose: () => void
    onResponsesReceived: (metadata: MetadataInput) => void
    downloadMenuComponent?: object | (() => void)
    initialFocus?: boolean
}

export type InterpretationModal = FC<InterpretationModalProps>
