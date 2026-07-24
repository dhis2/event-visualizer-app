import {
    DEFAULT_OPTIONS,
    OPTIONS_TAB_KEYS_LINE_LIST,
    OPTIONS_TAB_KEYS_PIVOT_TABLE,
} from '@constants/options'
import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from '@modules/utils/guards'
import type {
    VisualizationType,
    EventVisualizationOptions,
    OptionsTab,
    OptionsTabKey,
    LegendOption,
    AppCachedData,
    EventVisualizationOptionFieldName,
} from '@types'
import deepEqual from 'deep-equal'

export const getOptionsTabsDisplayNames = (): Record<
    OptionsTabKey,
    string
> => ({
    data: i18n.t('Data'),
    style: i18n.t('Style'),
    legend: i18n.t('Legend'),
})

const toOptionsTabsArray = (optionKeys: ReadonlyArray<OptionsTabKey>) => {
    const displayNameLookup = getOptionsTabsDisplayNames()
    return optionKeys.map((key) => ({
        key: key,
        label: displayNameLookup[key],
    }))
}

export const getOptionsTabsForVisType = (
    visType: VisualizationType
): OptionsTab[] => {
    switch (visType) {
        case 'LINE_LIST':
            return toOptionsTabsArray(OPTIONS_TAB_KEYS_LINE_LIST)
        case 'PIVOT_TABLE':
            return toOptionsTabsArray(OPTIONS_TAB_KEYS_PIVOT_TABLE)
        default:
            throw new Error('Unknown visType provided')
    }
}

export const getDefaultOptions = (
    digitGroupSeparator: AppCachedData['systemSettings']['digitGroupSeparator']
): EventVisualizationOptions => ({ ...DEFAULT_OPTIONS, digitGroupSeparator })

export const getDisabledOptions = (options: EventVisualizationOptions) => {
    const disabledOptions: EventVisualizationOptionFieldName[] = []

    // Disable totals options when cumulativeValues is used
    if (options?.cumulativeValues) {
        disabledOptions.push(
            'colTotals',
            'colSubTotals',
            'rowTotals',
            'rowSubTotals'
        )
    }

    return disabledOptions
}

// Returns options with disabled keys blanked to undefined so they don't land
// on the persisted visualization (e.g. col/row totals when cumulativeValues
// is set). Caller can spread the result into the vis object.
export const getEnabledOptions = (
    options: EventVisualizationOptions
): EventVisualizationOptions => {
    const disabled = new Set(getDisabledOptions(options))
    const result: EventVisualizationOptions = { ...options }
    for (const key of disabled) {
        result[key] = undefined
    }
    return result
}

/* Returns only the options that differ from the defaults: an option is dropped
 * when it is unset or equal to its default value. Used to compare two
 * visualizations while treating a default-valued option and an absent option
 * as the same. */
export const getNonDefaultOptions = (
    options: EventVisualizationOptions
): EventVisualizationOptions => {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(
        DEFAULT_OPTIONS
    ) as EventVisualizationOptionFieldName[]) {
        const value = options[key]
        if (value !== undefined && !deepEqual(value, DEFAULT_OPTIONS[key])) {
            result[key] = value
        }
    }
    return result as EventVisualizationOptions
}

export const isPopulatedLegendOption = (
    value: EventVisualizationOptions['legend']
): value is LegendOption =>
    typeof value === 'object' &&
    'style' in value &&
    'strategy' in value &&
    isPopulatedString(value.strategy) &&
    isPopulatedString(value.style)
