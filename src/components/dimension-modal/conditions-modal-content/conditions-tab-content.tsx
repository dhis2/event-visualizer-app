import { GroupingRadio } from '@components/dimension-modal/grouping-radio/grouping-radio'
import { useDimensionLegendSets } from '@components/dimension-modal/grouping-radio/use-dimension-legend-sets'
import { useAppSelector } from '@hooks'
import { getVisUiConfigConditionsByDimension } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { type FC } from 'react'
import { FilterSection } from './filter-section'
import classes from './styles/conditions-modal-content.module.css'

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
                <GroupingRadio
                    dimensionId={dimension.id}
                    legendSets={legendSets}
                />
            )}
            {/* Keyed on the grouping value so a change remounts the filter,
                clearing out filter state left from the previous grouping. */}
            <FilterSection
                key={selectedLegendSetId ?? 'ungrouped'}
                dimension={dimension}
                showHeading={canBeGrouped}
            />
        </div>
    )
}
