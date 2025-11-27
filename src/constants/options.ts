import type { EventVisualizationOptions } from '@types'

export const OPTIONS_SECTION_KEYS_LINE_LIST = [
    'data',
    'style',
    'legend',
] as const
export const OPTIONS_SECTION_KEYS_PIVOT_TABLE = [
    'data',
    'style',
    'legend',
] as const

export const DEFAULT_LEGEND_OPTIONS: EventVisualizationOptions['legend'] = {
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
    // Needs to be populated from user settings
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
