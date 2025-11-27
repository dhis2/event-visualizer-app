import type { EventVisualization } from './dhis2-openapi-schemas'
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
    key: OptionsSectionKey
    label: string
}
export type EventVisualizationOptions = Partial<
    Pick<
        EventVisualization,
        /* Below are all option keys from DV and LL, deduplicated and sorted.
         * Field that were found as nested properties under top-level fields have been removed.
         * The fields that are commented out are not presentr of the EventVisualization type
         * I am keeping these here because it is not completely clear what needs to happen to these:
         * A. The field could be redundant
         * B. The field might be relevant and support needs to be added to the web api
         * C. The field is an app-only field (non-persisted) */
        | 'aggregationType'
        | 'baseLineValue'
        | 'colSubTotals'
        | 'colTotals'
        | 'completedOnly'
        | 'cumulativeValues'
        | 'digitGroupSeparator'
        | 'displayDensity'
        | 'fontSize'
        | 'hideEmptyRowItems'
        | 'hideEmptyRows'
        | 'hideSubtitle'
        | 'hideTitle'
        | 'noSpaceBetweenColumns'
        | 'percentStackedValues'
        | 'regressionType'
        | 'rowSubTotals'
        | 'rowTotals'
        | 'showData'
        | 'showDimensionLabels'
        | 'showHierarchy'
        | 'skipRounding'
        | 'sortOrder'
        | 'subtitle'
        | 'targetLineValue'
        | 'title'
        | 'topLimit'
        // | 'approvalLevel'
        // | 'axes'
        // | 'axisTitle'
        // | 'axisTitleTextMode'
        // | 'baseLineEnabled'
        // | 'baseLineTitle'
        // | 'baseLineTitleFontStyle'
        // | 'colorSet'
        // | 'cumulative'
        // | 'decimals'
        // | 'fixColumnHeaders'
        // | 'fixRowHeaders'
        // | 'fontStyle'
        // | 'grandParentOrganisationUnit'
        // | 'hideEmptyColumns'
        // | 'icons'
        // | 'maxValue'
        // | 'measureCriteria'
        // | 'minValue'
        // | 'numberType'
        // | 'organisationUnit'
        // | 'outlierAnalysis'
        // | 'parentOrganisationUnit'
        // | 'regression'
        // | 'reportingPeriod'
        // | 'series'
        // | 'seriesKey'
        // | 'showSeriesKey'
        // | 'steps'
        // | 'targetLineEnabled'
        // | 'targetLineTitle'
        // | 'targetLineTitleFontStyle'
    > & {
        /* Use a custom legend field, which is a subset of the
         * fields of the generated type (and a simplified set) */
        legend: Pick<
            NonNullable<EventVisualization['legend']>,
            'showKey' | 'strategy' | 'style'
        > & {
            set?: {
                id: string
                displayName: string
            }
        }
    }
>
