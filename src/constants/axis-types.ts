// Individual axis ID constants
export const AXIS_ID_COLUMNS = 'columns'
export const AXIS_ID_FILTERS = 'filters'
export const AXIS_ID_ROWS = 'rows'

export const SUPPORTED_AXIS_IDS = [
    AXIS_ID_COLUMNS,
    AXIS_ID_FILTERS,
    AXIS_ID_ROWS,
] as const

export type SupportedAxisId = (typeof SUPPORTED_AXIS_IDS)[number]
