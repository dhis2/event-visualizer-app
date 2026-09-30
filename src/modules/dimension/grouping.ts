import { isLegendGroupingFilter } from '@modules/conditions'
import { isValueTypeNumeric } from '@modules/value-type'
import type { DimensionArray, DimensionRecord, ValueType } from '@types'

/* Legend sets group numeric values into ranges, so only numeric data items can
 * be grouped. Program indicators carry no valueType but are always numeric. */
export const canDimensionHaveLegendSets = (dimension: {
    dimensionType?: DimensionRecord['dimensionType']
    valueType?: ValueType
}): boolean =>
    dimension.dimensionType === 'PROGRAM_INDICATOR' ||
    Boolean(dimension.valueType && isValueTypeNumeric(dimension.valueType))

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

        return groupingApplies
            ? dimension
            : { ...dimension, legendSet: undefined }
    })
