import type { PivotTableAnalyticsData } from '@components/plugin-wrapper/hooks/use-pivot-table-analytics-data'
import type { CurrentVisualization, LegendSet } from '@types'
import type { FC } from 'react'

type PivotTableProps = {
    data: PivotTableAnalyticsData
    visualization: CurrentVisualization
    legendSets?: LegendSet[]
    renderCounter?: number
    onToggleContextualMenu?: () => void
}

export type PivotTable = FC<PivotTableProps>
