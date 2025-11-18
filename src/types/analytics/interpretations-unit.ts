import type { FC } from 'react'

type InterpretationsUnitProps = {
    id: string
    type: string
    onInterpretationClick: (id: string) => void
    dashboardRedirectUrl?: string
    disabled?: boolean
    visualizationHasTimeDimension?: boolean
    onReplyIconClick?: (id: string) => void
}

export type InterpretationsUnit = FC<InterpretationsUnitProps>
