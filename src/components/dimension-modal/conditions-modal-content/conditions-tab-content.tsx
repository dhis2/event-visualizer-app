import { useAppSelector } from '@hooks'
import { getVisUiConfigConditionsByDimension } from '@store/vis-ui-config-slice'
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
    const { legendSet: selectedLegendSetId } = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )

    const canBeGrouped = legendSets.length > 0

    return (
        <div className={classes.tabContent}>
            {canBeGrouped && (
                <GroupingSection
                    dimensionId={dimension.id}
                    legendSets={legendSets}
                />
            )}
            {/* Keyed on the grouping value so a change remounts the filter,
                clearing out filter state left from the previous grouping. */}
            <FilteringSection
                key={selectedLegendSetId ?? 'ungrouped'}
                dimension={dimension}
                showHeading={canBeGrouped}
            />
        </div>
    )
}
