export const SUPPORTED_AXIS_IDS = [
    'AXIS_ID_COLUMNS',
    'AXIS_ID_FILTERS',
    'AXIS_ID_ROWS',
    'AXIS_ID_YOY_SERIES',
    'AXIS_ID_YOY_CATEGORY',
] as const

export type SupportedAxisIds = (typeof SUPPORTED_AXIS_IDS)[number]
