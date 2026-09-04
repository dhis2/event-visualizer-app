import { legendSetsApi } from '@api/legend-sets-api'
import { canDimensionHaveLegendSets } from '@modules/dimension/grouping'
import type { DimensionMetadataItem, LegendSetMetadataItem } from '@types'

const NO_LEGEND_SETS: LegendSetMetadataItem[] = []

type UseDimensionLegendSetsResult = {
    legendSets: LegendSetMetadataItem[]
    isLoading: boolean
}

export const useDimensionLegendSets = (
    dimension: DimensionMetadataItem
): UseDimensionLegendSetsResult => {
    const canHaveLegendSets = canDimensionHaveLegendSets(dimension)

    const { data, isLoading } = legendSetsApi.useGetLegendSetsByDimensionQuery(
        {
            dimensionId: dimension.id,
            dimensionType: dimension.dimensionType,
        },
        { skip: !canHaveLegendSets }
    )

    return {
        legendSets: data ?? NO_LEGEND_SETS,
        isLoading: canHaveLegendSets && isLoading,
    }
}
