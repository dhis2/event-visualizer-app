import type { ValueType } from '@types'

export const NUMERIC_VALUE_TYPES: ValueType[] = [
    'NUMBER',
    'UNIT_INTERVAL',
    'PERCENTAGE',
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
] as const

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
    'TRACKER_ASSOCIATE',
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
