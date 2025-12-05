import type { FC } from 'react'
import { LineListDataTab } from './tabs/line-list-data-tab'
import { LineListLegendTab } from './tabs/line-list-legend-tab'
import { LineListStyleTab } from './tabs/line-list-style-tab'
import { PivotTableDataTab } from './tabs/pivot-table-data-tab'
import { PivotTableStyleTab } from './tabs/pivot-table-style-tab'
import type { VisualizationType } from '@types'
import type {
    OptionsTabKey,
    OptionsTabKeyLineList,
    OptionsTabKeyPivotTable,
} from 'src/types/options'

type OptionsTabContentProps = {
    visType: VisualizationType
    tabKey: OptionsTabKey
}
export const OptionsTabContent: FC<OptionsTabContentProps> = ({
    visType,
    tabKey,
}) => {
    if (visType === 'LINE_LIST') {
        switch (tabKey as OptionsTabKeyLineList) {
            case 'data':
                return <LineListDataTab />
            case 'legend':
                return <LineListLegendTab />
            case 'style':
                return <LineListStyleTab />
        }
    } else if (visType === 'PIVOT_TABLE') {
        switch (tabKey as OptionsTabKeyPivotTable) {
            case 'data':
                return <PivotTableDataTab />
            case 'style':
                return <PivotTableStyleTab />
        }
    } else {
        throw new Error(
            `Unknown option tab for visType ${visType} tab key ${tabKey}`
        )
    }
}
