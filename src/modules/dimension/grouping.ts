import { isLegendGroupingFilter } from '@modules/conditions'
import { isValueTypeNumeric } from '@modules/value-type'
import type { DimensionArray, DimensionRecord, ValueType } from '@types'

/* Legend sets group numeric values into ranges, so only numeric data items can
 * be grouped. Program indicators are numeric too, but analytics ignores their
 * legend set when grouping and rejects a legend filter on them (E7234). */
export const canDimensionHaveLegendSets = (dimension: {
    dimensionType?: DimensionRecord['dimensionType']
    valueType?: ValueType
}): boolean =>
    dimension.dimensionType !== 'PROGRAM_INDICATOR' &&
    Boolean(dimension.valueType && isValueTypeNumeric(dimension.valueType))

/* A program indicator has no option set, so an IN filter beside its legend set
 * can only pick legends. Without the legend set analytics would read the
 * legend IDs as values. */
const isProgramIndicatorLegendFilter = (dimension: DimensionRecord): boolean =>
    dimension.dimensionType === 'PROGRAM_INDICATOR' &&
    isLegendGroupingFilter(dimension.filter)

export const dropInvalidGrouping = (
    dimensions: DimensionArray
): DimensionArray =>
    dimensions.map((dimension) => {
        if (!dimension.legendSet) {
            return dimension
        }

        const groupingApplies =
            canDimensionHaveLegendSets(dimension) &&
            (!dimension.filter || isLegendGroupingFilter(dimension.filter))

        if (groupingApplies) {
            return dimension
        }

        return isProgramIndicatorLegendFilter(dimension)
            ? { ...dimension, legendSet: undefined, filter: undefined }
            : { ...dimension, legendSet: undefined }
    })
