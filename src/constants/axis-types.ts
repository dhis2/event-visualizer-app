// Individual axis ID constants
export const AXIS_ID_COLUMNS = 'AXIS_ID_COLUMNS'
export const AXIS_ID_FILTERS = 'AXIS_ID_FILTERS'
export const AXIS_ID_ROWS = 'AXIS_ID_ROWS'
export const AXIS_ID_YOY_SERIES = 'AXIS_ID_YOY_SERIES'
export const AXIS_ID_YOY_CATEGORY = 'AXIS_ID_YOY_CATEGORY'

export const SUPPORTED_AXIS_IDS = [
    AXIS_ID_COLUMNS,
    AXIS_ID_FILTERS,
    AXIS_ID_ROWS,
    AXIS_ID_YOY_SERIES,
    AXIS_ID_YOY_CATEGORY,
] as const

export type SupportedAxisId = (typeof SUPPORTED_AXIS_IDS)[number]
