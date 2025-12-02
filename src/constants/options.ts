import type { EventVisualizationOptions, LegendOption } from '@types'

// Base options section keys shared by all visualization types
const OPTIONS_SECTION_KEYS = ['data', 'style', 'legend'] as const

// Re-export with specific names for backwards compatibility and type derivation
export const OPTIONS_SECTION_KEYS_LINE_LIST = OPTIONS_SECTION_KEYS
export const OPTIONS_SECTION_KEYS_PIVOT_TABLE = OPTIONS_SECTION_KEYS

export const DEFAULT_LEGEND_OPTION: LegendOption = {
    showKey: false,
    strategy: 'BY_DATA_ITEM',
    style: 'FILL',
    set: undefined,
}
export const DEFAULT_OPTIONS: EventVisualizationOptions = {
    aggregationType: 'SUM',
    baseLineValue: undefined,
    colSubTotals: false,
    colTotals: false,
    completedOnly: false,
    cumulativeValues: false,
    // Populated from user settings in the preloadedState
    digitGroupSeparator: undefined,
    displayDensity: 'NORMAL',
    fontSize: 'NORMAL',
    hideEmptyRowItems: 'NONE',
    hideEmptyRows: false,
    hideSubtitle: false,
    hideTitle: false,
    // Populate with default legend object
    legend: undefined,
    noSpaceBetweenColumns: false,
    percentStackedValues: false,
    regressionType: 'LINEAR',
    rowSubTotals: false,
    rowTotals: false,
    showData: false,
    showDimensionLabels: false,
    showHierarchy: false,
    skipRounding: false,
    sortOrder: undefined,
    subtitle: undefined,
    targetLineValue: undefined,
    title: undefined,
    topLimit: undefined,
}
