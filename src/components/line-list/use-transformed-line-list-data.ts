import {
    useMetadataStore,
    type UseMetadataStoreReturnValue,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import type {
    AnalyticsResponseMetadataItems,
    LineListAnalyticsData,
    LineListAnalyticsDataHeader,
    LineListLegendSet,
    LineListRowContext,
} from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import { getColorByValueFromLegendSet, formatValue } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { headersMap } from '@modules/analytics-request'
import { formatBooleanValue, isBooleanValue } from '@modules/conditions'
import { extractPlainDimensionId } from '@modules/dimension/ids'
import {
    buildSuffixContext,
    getDimensionSuffix,
} from '@modules/dimension/suffix'
import { resolveLayoutContext } from '@modules/layout'
import { getStatusName, isStatus } from '@modules/status'
import { isValueTypeNumeric } from '@modules/value-type'
import type {
    CurrentVisualization,
    DimensionMetadataItem,
    LegendSet,
    MetadataInputItem,
    ValueType,
} from '@types'
import moment from 'moment'
import { useMemo } from 'react'
import type { LineListPager } from './types'

export type LineListHeader = {
    name: string
    displayText: string
    dimensionId: string
}
export type LineListCellData = {
    formattedValue: string
    value: string
    backgroundColor?: string
    isUndefined?: boolean
    isUrl?: boolean
    shouldNotWrap?: boolean
    textColor?: string
}
export type LineListRow = Array<LineListCellData>
export type LineListData = {
    headers: Array<LineListHeader>
    rows: Array<LineListRow>
    pager: LineListPager
    legendSets: LegendSet[]
}

type TransformedLineListHeader = Omit<
    LineListAnalyticsDataHeader,
    'legendSet'
> & {
    /* Resolved from the fetched legend sets based on legend strategy; not
     * every header carries one (e.g. non-numeric columns, or visualizations
     * without a legend). */
    legendSet?: LineListLegendSet
    /* Stage/program disambiguation suffix, combined with `column` at render. */
    dimensionSuffix?: string
}

const isStageOffsetInteger = (stageOffset: unknown): stageOffset is number =>
    Number.isInteger(stageOffset)

export const getHeaderDisplayText = (
    header: Pick<
        TransformedLineListHeader,
        'column' | 'stageOffset' | 'dimensionSuffix'
    >
) => {
    const { column, stageOffset, dimensionSuffix } = header

    if (!column) {
        return ''
    }

    const label = dimensionSuffix ? `${column} · ${dimensionSuffix}` : column

    if (isStageOffsetInteger(stageOffset)) {
        let repetitionSuffix

        if (stageOffset === 0) {
            repetitionSuffix = i18n.t('most recent')
        } else if (stageOffset === 1) {
            repetitionSuffix = i18n.t('oldest')
        } else if (stageOffset > 1) {
            repetitionSuffix = i18n.t('oldest {{- repeatEventIndex}}', {
                repeatEventIndex: `+${stageOffset - 1}`,
            })
        } else if (stageOffset < 0) {
            repetitionSuffix = i18n.t('most recent {{- repeatEventIndex}}', {
                repeatEventIndex: stageOffset,
            })
        }

        return `${label} (${repetitionSuffix})`
    }

    return label
}

type ResolveLegendSetArgs = {
    dimensionId: string
    valueType: ValueType
    legend: CurrentVisualization['legend']
    metadataStore: UseMetadataStoreReturnValue
    legendSets: LineListLegendSet[]
}

const resolveLegendSet = ({
    dimensionId,
    valueType,
    legend,
    metadataStore,
    legendSets,
}: ResolveLegendSetArgs): LineListLegendSet | undefined => {
    if (!legendSets.length || !isValueTypeNumeric(valueType)) {
        return undefined
    }
    if (legend?.strategy === 'FIXED') {
        return legendSets[0]
    }
    if (legend?.strategy === 'BY_DATA_ITEM') {
        const item = metadataStore.getDimensionMetadataItem(dimensionId)
        if (!item?.legendSetId) {
            return undefined
        }
        return legendSets.find((legendSet) => legendSet.id === item.legendSetId)
    }
    return undefined
}

type TransformHeadersArgs = {
    analyticsData: LineListAnalyticsData
    visualization: CurrentVisualization
    metadataStore: UseMetadataStoreReturnValue
}

export const transformHeaders = ({
    analyticsData,
    visualization,
    metadataStore,
}: TransformHeadersArgs): Array<TransformedLineListHeader> => {
    const storeMetadata: Record<string, DimensionMetadataItem> = {}
    for (const header of analyticsData.headers) {
        const item = metadataStore.getDimensionMetadataItem(header.dimensionId)
        if (item) {
            storeMetadata[header.dimensionId] = item
        }
    }

    const metadata = { ...analyticsData.metaDataItems, ...storeMetadata }

    /* Only the headers with dimension metadata in the store; other headers
     * (e.g. value columns) have none and resolveLayoutContext would throw. */
    const { programIds, programStageIds } = resolveLayoutContext(
        Object.keys(storeMetadata),
        metadataStore
    )
    const suffixContext = buildSuffixContext({
        programs: Object.values(metadataStore.getMetadataItems(programIds)),
        programStages: Object.values(
            metadataStore.getMetadataItems(programStageIds)
        ),
    })

    return analyticsData.headers.map((header): TransformedLineListHeader => ({
        ...header,
        legendSet: resolveLegendSet({
            dimensionId: header.dimensionId,
            valueType: header.valueType,
            legend: visualization.legend,
            metadataStore,
            legendSets: analyticsData.legendSets,
        }),
        column: metadata[header.dimensionId]?.name ?? header.dimensionId,
        dimensionSuffix: storeMetadata[header.dimensionId]
            ? getDimensionSuffix(
                  storeMetadata[header.dimensionId],
                  suffixContext
              )
            : undefined,
    }))
}

const NOT_DEFINED_VALUE = 'ND'
const isValueUndefined = (
    rowContext: LineListRowContext = {},
    rowIndex: number,
    columnIndex: number
) => rowContext[rowIndex]?.[columnIndex]?.valueStatus === NOT_DEFINED_VALUE

const NON_WRAPPING_VALUE_TYPES_LOOKUP = new Set<ValueType>([
    'NUMBER',
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
    'PERCENTAGE',
    'UNIT_INTERVAL',
    'TIME',
    'DATE',
    'DATETIME',
    'PHONE_NUMBER',
])
const cellValueShouldNotWrap = (header: TransformedLineListHeader) =>
    NON_WRAPPING_VALUE_TYPES_LOOKUP.has(header.valueType) && !header.optionSet

const DATE_VALUE_TYPES: ValueType[] = ['DATE', 'DATETIME']
const TIME_DIMENSION_HEADER_NAMES = new Set([
    headersMap.eventDate,
    headersMap.enrollmentDate,
    headersMap.incidentDate,
    headersMap.scheduledDate,
])
const STATUS_HEADER_NAMES = new Set([
    headersMap.eventStatus,
    headersMap.programStatus,
])

/* Time dimensions (event/enrollment/incident/scheduledDate) are typed as
 * DATETIME on the backend but should render as plain date (DHIS2-17855).
 * lastUpdated keeps its DATETIME format. */
const formatDateLikeValue = (
    value: string,
    header: TransformedLineListHeader
): string => {
    const isTimeDimension =
        header.name !== undefined &&
        TIME_DIMENSION_HEADER_NAMES.has(header.name)
    const includeTime =
        !isTimeDimension &&
        (header.name === headersMap.lastUpdated ||
            header.valueType === 'DATETIME')
    return moment(value).format(includeTime ? 'yyyy-MM-DD HH:mm' : 'yyyy-MM-DD')
}

type OptionSetMetaDataItem = MetadataInputItem & {
    options: Array<{ code?: string; uid?: string }>
}

const lookupOptionSetOptionMetadata = (
    optionSetId: string,
    code: string,
    metaDataItems: AnalyticsResponseMetadataItems
) => {
    const optionSetMetaData = metaDataItems?.[optionSetId] as
        OptionSetMetaDataItem | undefined

    if (optionSetMetaData) {
        const optionId = optionSetMetaData.options.find(
            (option) => option.code === code
        )?.uid

        return optionId ? metaDataItems[optionId] : undefined
    }

    return undefined
}

/* Resolves the raw analytics value to a human-readable one: booleans to
 * Yes/No, option codes to option names, metadata item IDs (e.g. legend IDs
 * for values grouped by legend) to their names. */
const resolveCellValue = ({
    rawValue,
    header,
    metaDataItems,
    isUndefined,
}: {
    rawValue: string
    header: TransformedLineListHeader
    metaDataItems: AnalyticsResponseMetadataItems
    isUndefined: boolean
}) => {
    if (!rawValue) {
        return rawValue
    }

    switch (header.valueType) {
        case 'BOOLEAN':
        case 'TRUE_ONLY':
            if (isUndefined) {
                return ''
            }
            return isBooleanValue(rawValue)
                ? formatBooleanValue(rawValue)
                : rawValue
        default: {
            const { optionSet: optionSetId } = header
            if (optionSetId) {
                return rawValue
                    .split(',')
                    .map(
                        (code) =>
                            lookupOptionSetOptionMetadata(
                                optionSetId,
                                code,
                                metaDataItems
                            )?.name || code
                    )
                    .join(', ')
            }

            return metaDataItems[rawValue]?.name || rawValue
        }
    }
}

type FormatCellValueArgs = {
    rawValue: string
    header: TransformedLineListHeader
    visualization: CurrentVisualization
    metaDataItems: AnalyticsResponseMetadataItems
    isUndefined: boolean
}

export const formatCellValue = ({
    rawValue,
    header,
    visualization,
    metaDataItems,
    isUndefined,
}: FormatCellValueArgs): { value: string; formattedValue: string } => {
    const value = resolveCellValue({
        rawValue,
        header,
        metaDataItems,
        isUndefined,
    })

    // header.name might be prefixed with programStage.id
    const dimensionId = extractPlainDimensionId(header.name)

    if (dimensionId && STATUS_HEADER_NAMES.has(dimensionId)) {
        return {
            value,
            formattedValue: isStatus(value) ? getStatusName(value) : value,
        }
    }

    if (DATE_VALUE_TYPES.includes(header.valueType)) {
        return {
            value,
            formattedValue: value && formatDateLikeValue(value, header),
        }
    }

    if (header.valueType === 'AGE') {
        return {
            value,
            formattedValue: value && moment(value).format('yyyy-MM-DD'),
        }
    }

    return {
        value,
        formattedValue: formatValue(
            value,
            header.valueType || 'TEXT',
            header.optionSet
                ? {}
                : {
                      digitGroupSeparator: visualization.digitGroupSeparator,
                      skipRounding: false,
                  }
        ),
    }
}

/* TODO: Figure out what the reasoning is behind this and refactor,
 * or clarify with comments */
const extractLegendSets = (
    headers: TransformedLineListHeader[]
): LegendSet[] => {
    const allLegendSets = headers.reduce<
        NonNullable<TransformedLineListHeader['legendSet']>[]
    >((acc, header) => {
        if (header.legendSet) {
            acc.push(header.legendSet)
        }
        return acc
    }, [])
    return allLegendSets.filter(
        (e, index) =>
            allLegendSets.findIndex((a) => a.id === e.id) === index &&
            e.legends?.length
    )
}

type TransformLineListDataArgs = {
    analyticsData: LineListAnalyticsData
    visualization: CurrentVisualization
    metadataStore: UseMetadataStoreReturnValue
}

export const transformLineListData = ({
    analyticsData,
    visualization,
    metadataStore,
}: TransformLineListDataArgs): LineListData => {
    const transformedHeaders = transformHeaders({
        analyticsData,
        visualization,
        metadataStore,
    })
    const headers = transformedHeaders.map((header) => ({
        name: header.name ?? '',
        displayText: getHeaderDisplayText(header),
        dimensionId: header.dimensionId,
    }))
    const rows = analyticsData.rows.map((row, rowIndex) =>
        row.map((rawValue, columnIndex) => {
            const header = transformedHeaders[columnIndex]
            const isUndefined = isValueUndefined(
                analyticsData.rowContext,
                rowIndex,
                columnIndex
            )
            const { value, formattedValue } = formatCellValue({
                rawValue,
                header,
                visualization,
                metaDataItems: analyticsData.metaDataItems,
                isUndefined,
            })
            return {
                formattedValue,
                value,
                backgroundColor:
                    visualization.legend?.style === 'FILL'
                        ? getColorByValueFromLegendSet(header.legendSet, value)
                        : undefined,
                isUndefined,
                isUrl: header.valueType === 'URL',
                shouldNotWrap: cellValueShouldNotWrap(header),
                textColor:
                    visualization.legend?.style === 'TEXT'
                        ? getColorByValueFromLegendSet(header.legendSet, value)
                        : undefined,
            }
        })
    )
    const legendSets = extractLegendSets(transformedHeaders)

    return { headers, rows, pager: analyticsData.pager, legendSets }
}

export const useTransformedLineListData = (
    analyticsData: LineListAnalyticsData,
    visualization: CurrentVisualization
): LineListData => {
    const metadataStore = useMetadataStore()
    return useMemo(
        () =>
            transformLineListData({
                analyticsData,
                visualization,
                metadataStore,
            }),
        [analyticsData, visualization, metadataStore]
    )
}
