import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from '@components/app-wrapper/metadata-helpers/type-guards'
import {
    DEFAULT_OPTIONS,
    OPTIONS_TAB_KEYS_LINE_LIST,
    OPTIONS_TAB_KEYS_PIVOT_TABLE,
} from '@constants/options'
import type {
    VisualizationType,
    EventVisualizationOptions,
    OptionsTab,
    OptionsTabKey,
    LegendOption,
    AppCachedData,
} from '@types'

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
    const disabledOptions = [] as string[]

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

export const isPopulatedLegendOption = (
    value: EventVisualizationOptions['legend']
): value is LegendOption =>
    typeof value === 'object' &&
    'style' in value &&
    'strategy' in value &&
    isPopulatedString(value.strategy) &&
    isPopulatedString(value.style)
