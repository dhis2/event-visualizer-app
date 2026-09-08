import { isValueTypeNumeric } from '@modules/value-type'
import type { DimensionType, ValueType } from '@types'

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
