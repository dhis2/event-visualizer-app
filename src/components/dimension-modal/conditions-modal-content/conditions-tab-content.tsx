import type { DimensionMetadataItem } from '@types'
import { type FC } from 'react'
import { FilteringSection } from './filtering-section'
import { GroupingSection } from './grouping-section'
import classes from './styles/conditions-modal-content.module.css'
import { useDimensionLegendSets } from './use-dimension-legend-sets'

type ConditionsTabContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsTabContent: FC<ConditionsTabContentProps> = ({
    dimension,
}) => {
    const { legendSets } = useDimensionLegendSets(dimension)

    const canBeGrouped = legendSets.length > 0

    return (
        <div className={classes.tabContent}>
            {canBeGrouped ? (
                <GroupingSection
                    dimension={dimension}
                    legendSets={legendSets}
                />
            ) : (
                <FilteringSection dimension={dimension} />
            )}
        </div>
    )
}
