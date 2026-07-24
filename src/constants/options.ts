import type { EventVisualizationOptions, LegendOption } from '@types'

export const OPTIONS_TAB_KEYS_LINE_LIST = ['data', 'style', 'legend'] as const
export const OPTIONS_TAB_KEYS_PIVOT_TABLE = ['data', 'style'] as const

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
    /* A visualization has no fixed default separator: a new vis seeds its
     * value from the `digitGroupSeparator` system setting (see
     * getDefaultOptions, applied to the preloaded store state). Left undefined
     * here so getNonDefaultOptions never treats a concrete separator as a
     * default — a saved vis always keeps its own value. */
    digitGroupSeparator: undefined,
    displayDensity: 'NORMAL',
    fontSize: 'NORMAL',
    /* A supported eventVisualizations API option, but not implemented in this
     * app yet (only "hide empty rows" is). Kept commented out here and in the
     * EventVisualizationOptions type; uncomment in both to wire it up. */
    // hideEmptyColumns: false,
    hideNaData: false,
    hideEmptyRowItems: 'NONE',
    hideEmptyRows: false,
    hideSubtitle: false,
    hideTitle: false,
    /* undefined means "no legend" — the default (the legend checkbox is off).
     * DEFAULT_LEGEND_OPTION is not the default here: it is the initial config
     * seeded when the user turns the legend on (see the Legend options field). */
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
export const ANALYTICS_OPTIONS: Pick<
    EventVisualizationOptions,
    'completedOnly' | 'skipRounding'
> = (({ completedOnly, skipRounding }) => ({
    completedOnly,
    skipRounding,
}))(DEFAULT_OPTIONS)
