import type { ValueType } from '@types'
import { asStringLiteralSubsetArray } from './as-string-literal-subset-array'

export const NUMERIC_VALUE_TYPES = asStringLiteralSubsetArray<ValueType>()([
    'NUMBER',
    'UNIT_INTERVAL',
    'PERCENTAGE',
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
    'BOOLEAN',
    'TRUE_ONLY',
] as const)

export const VALUE_TYPES: ValueType[] = [
    'TEXT',
    'LONG_TEXT',
    'MULTI_TEXT',
    'LETTER',
    'PHONE_NUMBER',
    'EMAIL',
    'BOOLEAN',
    'TRUE_ONLY',
    'DATE',
    'DATETIME',
    'TIME',
    'USERNAME',
    'COORDINATE',
    'ORGANISATION_UNIT',
    'REFERENCE',
    'AGE',
    'URL',
    'FILE_RESOURCE',
    'IMAGE',
    'GEOJSON',
    ...NUMERIC_VALUE_TYPES,
] as const
