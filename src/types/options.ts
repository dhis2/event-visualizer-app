import type { EventVisualization } from './dhis2-openapi-schemas'
import type {
    OPTIONS_TAB_KEYS_LINE_LIST,
    OPTIONS_TAB_KEYS_PIVOT_TABLE,
} from '@constants/options'

export type OptionsTabKeyLineList = (typeof OPTIONS_TAB_KEYS_LINE_LIST)[number]
export type OptionsTabKeyPivotTable =
    (typeof OPTIONS_TAB_KEYS_PIVOT_TABLE)[number]
export type OptionsTabKey = OptionsTabKeyLineList | OptionsTabKeyPivotTable
export type OptionsTab = {
    key: OptionsTabKey
    label: string
}
export type LegendOption = Pick<
    NonNullable<EventVisualization['legend']>,
    'showKey' | 'strategy' | 'style'
> & {
    set?: {
        id: string
        displayName: string
    }
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
        //        | 'fixColumnHeaders'
        //        | 'fixRowHeaders'
        | 'fontSize'
        //        | 'hideEmptyColumns'
        | 'hideEmptyRowItems'
        | 'hideEmptyRows'
        | 'hideNaData'
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
        legend: LegendOption
    }
>
