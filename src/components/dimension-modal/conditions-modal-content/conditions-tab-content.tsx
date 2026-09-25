import { useAppSelector } from '@hooks'
import {
    getVisUiConfigConditionsByDimension,
    getVisUiConfigIsCustomValue,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { type FC } from 'react'
import { AggregationSection } from './aggregation-section'
import { ConditionsProvider } from './conditions-provider'
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

    const isCustomValue = useAppSelector((state) =>
        getVisUiConfigIsCustomValue(state, dimension.id)
    )

    /* The cell value is aggregated from raw values, so it is never grouped. */
    const canBeGrouped = !isCustomValue && legendSets.length > 0

    return (
        <div className={classes.tabContent}>
            {isCustomValue && <AggregationSection dimension={dimension} />}
            {canBeGrouped && (
                <GroupingSection
                    dimensionId={dimension.id}
                    legendSets={legendSets}
                />
            )}
            {/* Keyed on the grouping value so a change remounts the provider,
                clearing out filter state left from the previous grouping. */}
            <ConditionsProvider
                key={selectedLegendSetId ?? 'ungrouped'}
                dimension={dimension}
            >
                <FilteringSection showHeading={canBeGrouped || isCustomValue} />
            </ConditionsProvider>
        </div>
    )
}
