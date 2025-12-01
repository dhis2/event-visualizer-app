import type { FC } from 'react'
import { LineListDataSection } from './sections/line-list-data-section'
import { LineListLegendSection } from './sections/line-list-legend-section'
import { LineListStyleSection } from './sections/line-list-style-section'
import { PivotTableDataSection } from './sections/pivot-table-data-section'
import { PivotTableStyleSection } from './sections/pivot-table-style-section'
import type { VisualizationType } from '@types'
import type {
    OptionsSectionKey,
    OptionsSectionKeyLineList,
    OptionsSectionKeyPivotTable,
} from 'src/types/options'

type OptionsSectionContentProps = {
    visType: VisualizationType
    sectionKey: OptionsSectionKey
}
export const OptionsSectionContent: FC<OptionsSectionContentProps> = ({
    visType,
    sectionKey,
}) => {
    if (visType === 'LINE_LIST') {
        switch (sectionKey as OptionsSectionKeyLineList) {
            case 'data':
                return <LineListDataSection />
            case 'legend':
                return <LineListLegendSection />
            case 'style':
                return <LineListStyleSection />
        }
    } else if (visType === 'PIVOT_TABLE') {
        switch (sectionKey as OptionsSectionKeyPivotTable) {
            case 'data':
                return <PivotTableDataSection />
            case 'style':
                return <PivotTableStyleSection />
        }
    } else {
        throw new Error(
            `Unknown option section for visType ${visType} section key ${sectionKey}`
        )
    }
}
