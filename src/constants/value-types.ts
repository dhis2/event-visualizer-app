import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'
import type { ValueType } from '@types'

export const SUPPORTED_VALUE_TYPES = asStringLiteralSubsetArray<ValueType>()([
    'AGE',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'EMAIL',
    'INTEGER',
    'INTEGER_NEGATIVE',
    'INTEGER_POSITIVE',
    'INTEGER_ZERO_OR_POSITIVE',
    'LETTER',
    'LONG_TEXT',
    'NUMBER',
    'ORGANISATION_UNIT',
    'PERCENTAGE',
    'PHONE_NUMBER',
    'TEXT',
    'TIME',
    'TRUE_ONLY',
    'UNIT_INTERVAL',
    'URL',
    'USERNAME',
] as const)

export type SupportedValueType = (typeof SUPPORTED_VALUE_TYPES)[number]
