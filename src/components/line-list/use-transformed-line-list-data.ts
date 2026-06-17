import type {
    LineListData,
    LineListAnalyticsData,
    LineListAnalyticsDataHeader,
} from '@components/line-list/types'
import { getColorByValueFromLegendSet, formatValue } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { extractPlainDimensionId } from '@modules/dimension'
import { getStatusName } from '@modules/status'
import { headersMap } from '@modules/visualization'
import type { CurrentVisualization, LegendSet, ValueType } from '@types'
import moment from 'moment'
import { useMemo } from 'react'

const isStageOffsetInteger = (stageOffset: unknown): stageOffset is number =>
    Number.isInteger(stageOffset)

export const getHeaderDisplayText = (header: LineListAnalyticsDataHeader) => {
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

const NOT_DEFINED_VALUE = 'ND'
const isValueUndefined = (
    rowContext: LineListAnalyticsData['rowContext'] = {},
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
const cellValueShouldNotWrap = (header: LineListAnalyticsDataHeader) =>
    NON_WRAPPING_VALUE_TYPES_LOOKUP.has(header.valueType) && !header.optionSet

const DATE_VALUE_TYPES: ValueType[] = ['DATE', 'DATETIME']

const getFormattedCellValue = ({
    value,
    header,
    visualization,
}: {
    value: string
    header: LineListAnalyticsDataHeader
    visualization: CurrentVisualization
}) => {
    // header.name might be prefixed with programStage.id
    const dimensionId = extractPlainDimensionId(header.name)

    if (
        dimensionId &&
        [headersMap.eventStatus, headersMap.programStatus].includes(dimensionId)
    ) {
        return getStatusName(value)
    }

    let valueType = header.valueType

    if (DATE_VALUE_TYPES.includes(valueType)) {
        if (
            header.name &&
            [
                headersMap.eventDate,
                headersMap.enrollmentDate,
                headersMap.incidentDate,
                headersMap.scheduledDate,
            ].includes(header.name)
        ) {
            // override valueType for time dimensions to format the value as date (DHIS2-17855)
            valueType = 'DATE'
        }

        return (
            value &&
            moment(value).format(
                header.name === headersMap.lastUpdated ||
                    valueType === 'DATETIME'
                    ? 'yyyy-MM-DD HH:mm'
                    : 'yyyy-MM-DD'
            )
        )
    } else if (valueType === 'AGE') {
        return value && moment(value).format('yyyy-MM-DD')
    } else {
        return formatValue(
            value,
            valueType || 'TEXT',
            header.optionSet
                ? {}
                : {
                      digitGroupSeparator: visualization.digitGroupSeparator,
                      skipRounding: false,
                  }
        )
    }
}

/* TODO: Figure out what the reasoning is behind this and refactor,
 * or clarify with comments */
const extractLegendSets = (
    headers: LineListAnalyticsDataHeader[]
): LegendSet[] => {
    const allLegendSets = headers
        .map((header) => header.legendSet)
        .filter((legendSet) => legendSet !== undefined)
    return allLegendSets.filter(
        (e, index) =>
            allLegendSets.findIndex((a) => a.id === e.id) === index &&
            e.legends?.length
    )
}

export const transformLineListData = (
    data: LineListAnalyticsData,
    visualization: CurrentVisualization
): LineListData => {
    const headers = data.headers.map((header) => ({
        name: header.name ?? '',
        displayText: getHeaderDisplayText(header),
        dimensionId: header.dimensionId,
    }))
    const { pager } = data
    const rows = data.rows.map((row, rowIndex) =>
        row.map((value, columnIndex) => ({
            formattedValue: getFormattedCellValue({
                value,
                header: data.headers[columnIndex],
                visualization,
            }),
            value,
            backgroundColor:
                visualization.legend?.style === 'FILL'
                    ? getColorByValueFromLegendSet(
                          data.headers[columnIndex].legendSet,
                          value
                      )
                    : undefined,
            isUndefined: isValueUndefined(
                data.rowContext,
                rowIndex,
                columnIndex
            ),
            isUrl: data.headers[columnIndex]?.valueType === 'URL',
            shouldNotWrap: cellValueShouldNotWrap(data.headers[columnIndex]),
            textColor:
                visualization.legend?.style === 'TEXT'
                    ? getColorByValueFromLegendSet(
                          data.headers[columnIndex].legendSet,
                          value
                      )
                    : undefined,
        }))
    )
    const legendSets = extractLegendSets(data.headers)

    return { headers, rows, pager, legendSets }
}

export const useTransformedLineListData = (
    data: LineListAnalyticsData,
    visualization: CurrentVisualization
): LineListData =>
    useMemo(
        () => transformLineListData(data, visualization),
        [data, visualization]
    )
