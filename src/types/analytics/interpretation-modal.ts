import type { CurrentVisualization, MetadataInput } from '@types'
import type { FC } from 'react'

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
