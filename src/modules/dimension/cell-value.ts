import { isValueTypeNumeric } from '@modules/value-type'
import type { DimensionMetadataItem } from '@types'

/* Whether a dimension can stand as the cell value at all. Only numeric-ness is
 * judged here: whether the choice suits the layout and the output type is
 * decided separately by the output type buttons, which is the only place that
 * question has an answer — the same selection can be valid for one output type
 * and invalid for another at the same moment. */
export const isValidCellValueDimension = (
    dimension: Pick<DimensionMetadataItem, 'valueType'> | undefined
): boolean =>
    Boolean(dimension?.valueType && isValueTypeNumeric(dimension.valueType))
