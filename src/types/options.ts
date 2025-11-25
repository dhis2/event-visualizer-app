import type {
    OPTIONS_SECTION_KEYS_LINE_LIST,
    OPTIONS_SECTION_KEYS_PIVOT_TABLE,
} from '@constants/options'

export type OptionsSectionKeyLineList =
    (typeof OPTIONS_SECTION_KEYS_LINE_LIST)[number]
export type OptionsSectionKeyPivotTable =
    (typeof OPTIONS_SECTION_KEYS_PIVOT_TABLE)[number]
export type OptionsSectionKey =
    | OptionsSectionKeyLineList
    | OptionsSectionKeyPivotTable
export type OptionsSection = {
    id: OptionsSectionKey
    displayName: string
}
