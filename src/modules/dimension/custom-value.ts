import { isValueTypeNumeric } from '@modules/value-type'
import type { AggregationType, DimensionType, ValueType } from '@types'

const CUSTOM_VALUE_DIMENSION_TYPES: DimensionType[] = [
    'DATA_ELEMENT',
    'PROGRAM_ATTRIBUTE',
]

/* The cell value is aggregated by the analytics API, so only numeric data
 * elements and tracked entity attributes can provide one. */
export const canDimensionBeCustomValue = ({
    dimensionType,
    valueType,
}: {
    dimensionType: DimensionType
    valueType?: ValueType
}): boolean =>
    CUSTOM_VALUE_DIMENSION_TYPES.includes(dimensionType) &&
    Boolean(valueType && isValueTypeNumeric(valueType))

/* An item whose own aggregation type is NONE cannot be aggregated: the
 * analytics API returns 0 for every cell. Many tracked entity attributes (and
 * some data elements) carry NONE, so "Use item default" is unavailable for them
 * and AVERAGE — a neutral numeric choice the user can override — is used
 * instead. */
export const FALLBACK_AGGREGATION_TYPE_FOR_NONE: AggregationType = 'AVERAGE'
