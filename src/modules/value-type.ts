import { NUMERIC_VALUE_TYPES } from '@constants/value-types'
import type { ValueType, NumericValueType } from '@types'

export const isValueTypeNumeric = (
    valueType: ValueType
): valueType is NumericValueType =>
    (NUMERIC_VALUE_TYPES as readonly string[]).includes(valueType)
