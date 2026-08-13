import { isValueTypeNumeric } from '@modules/value-type'
import type { DimensionMetadataItem } from '@types'

/* Legend sets band numeric values, so only numeric data items can be grouped.
 * Program indicators carry no valueType but are always numeric. */
export const canDimensionHaveLegendSets = (
    dimension: Pick<DimensionMetadataItem, 'dimensionType' | 'valueType'>
): boolean =>
    dimension.dimensionType === 'PROGRAM_INDICATOR' ||
    Boolean(dimension.valueType && isValueTypeNumeric(dimension.valueType))
