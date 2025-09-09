import type { FC } from 'react'
import type { CurrentVisualization } from '@types'

type PivotTableProps = {
    data: Record<string, string> // TODO figure out the type for the response
    visualization: CurrentVisualization
    renderCounter?: number
    legendSets?: Record<string, string>[] // TODO check type
    onToggleContextualMenu?: () => void
}

export type PivotTable = FC<PivotTableProps>
