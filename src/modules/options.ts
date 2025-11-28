import i18n from '@dhis2/d2-i18n'
import { isPopulatedString } from '@components/app-wrapper/metadata-helpers/type-guards'
import {
    DEFAULT_OPTIONS,
    OPTIONS_SECTION_KEYS_LINE_LIST,
    OPTIONS_SECTION_KEYS_PIVOT_TABLE,
} from '@constants/options'
import type {
    CurrentUser,
    VisualizationType,
    EventVisualizationOptions,
    OptionsSection,
    OptionsSectionKey,
    LegendOption,
} from '@types'

type OptionDef = {
    defaultValue: unknown
    persisted: boolean
}

export const options: Record<string, OptionDef> = {
    completedOnly: {
        defaultValue: false,
        persisted: true,
    },
    skipRounding: {
        defaultValue: false,
        persisted: true,
    },
}

export const getAllOptions = (): Record<string, OptionDef> => options

// This for now has only the 2 options that can be passed to the analytics request
export const getOptionsForRequest = (): [string, OptionDef][] =>
    Object.entries(getAllOptions())

export const getOptionsSectionsDisplayNames = (): Record<
    OptionsSectionKey,
    string
> => ({
    data: i18n.t('Data'),
    style: i18n.t('Style'),
    legend: i18n.t('Legend'),
})

const toOptionsSectionsArray = (
    optionKeys: ReadonlyArray<OptionsSectionKey>
) => {
    const displayNameLookup = getOptionsSectionsDisplayNames()
    return optionKeys.map((key) => ({
        key: key,
        label: displayNameLookup[key],
    }))
}

export const getOptionsSectionsForVisType = (
    visType: VisualizationType
): OptionsSection[] => {
    switch (visType) {
        case 'LINE_LIST':
            return toOptionsSectionsArray(OPTIONS_SECTION_KEYS_LINE_LIST)
        case 'PIVOT_TABLE':
            return toOptionsSectionsArray(OPTIONS_SECTION_KEYS_PIVOT_TABLE)
        default:
            throw new Error('Unknown visType provided')
    }
}

export const getDefaultOptions = (
    digitGroupSeparator: CurrentUser['settings']['digitGroupSeparator']
): EventVisualizationOptions => ({ ...DEFAULT_OPTIONS, digitGroupSeparator })

export const isPopulatedLegendOption = (
    value: EventVisualizationOptions['legend']
): value is LegendOption =>
    typeof value === 'object' &&
    'style' in value &&
    'strategy' in value &&
    isPopulatedString(value.strategy) &&
    isPopulatedString(value.style)
