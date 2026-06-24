import { getDefaultLegendSetId } from '@modules/display-mode'
import type { DimensionMetadataItem, LegendSetMetadataItem } from '@types'
import { legendSetsApi } from './numeric-condition/legend-sets-api'

const EMPTY_LEGEND_SETS: LegendSetMetadataItem[] = []

type UseDimensionLegendSetsResult = {
    legendSets: LegendSetMetadataItem[]
    legendSetCount: number
    defaultLegendSetId: string | undefined
    isLoading: boolean
}

/* Fetches a dimension's available legend sets on mount (not on dropdown focus)
 * so the Display section can decide whether to render before the user
 * interacts. Skipped entirely for dimensions that can't carry legend sets. */
export const useDimensionLegendSets = (
    dimension: DimensionMetadataItem,
    canHaveLegendSets: boolean
): UseDimensionLegendSetsResult => {
    const { data, isLoading, isFetching } =
        legendSetsApi.useGetLegendSetsByDimensionQuery(
            {
                dimensionId: dimension.id,
                dimensionType: dimension.dimensionType,
            },
            { skip: !canHaveLegendSets }
        )

    const legendSets = data ?? EMPTY_LEGEND_SETS

    return {
        legendSets,
        legendSetCount: legendSets.length,
        defaultLegendSetId: getDefaultLegendSetId(dimension, legendSets),
        isLoading: isLoading || isFetching,
    }
}
