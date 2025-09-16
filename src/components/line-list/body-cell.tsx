import i18n from '@dhis2/d2-i18n'
import { DataTableCell, Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import classes from './styles/body-cell.module.css'
import type { LineListAnalyticsData, Header, CellData } from './types'
import { getColorByValueFromLegendSet } from '@dhis2/analytics'
import type { ValueType, LegendDisplayStyle } from '@types'

const NOT_DEFINED_VALUE = 'ND'
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

const cellValueShouldNotWrap = (header: Header) =>
    NON_WRAPPING_VALUE_TYPES_LOOKUP.has(header.valueType) && !header.optionSet

const formatCellValue = (value: CellData, header: Header) => {
    if (header?.valueType === 'URL') {
        return (
            <a href={String(value)} target="_blank" rel="noreferrer">
                {value}
            </a>
        )
    } else {
        // return getFormattedCellValue({ value, header, visualization })
        return value
    }
}

const cellIsUndefined = (
    rowContext: LineListAnalyticsData['rowContext'] = {},
    rowIndex: number,
    columnIndex: number
) => rowContext[rowIndex]?.[columnIndex]?.valueStatus === NOT_DEFINED_VALUE

type TableCellProps = {
    fontSizeClass: string
    header: Header
    sizeClass: string
    value: CellData
    isUndefined?: boolean
    legendStyle?: LegendDisplayStyle
    tooltipProps?: object
}

const TableCell = ({
    fontSizeClass,
    header,
    sizeClass,
    value,
    isUndefined,
    legendStyle,
    tooltipProps,
}: TableCellProps) => (
    <DataTableCell
        {...tooltipProps}
        className={cx(
            classes.cell,
            fontSizeClass,
            sizeClass,
            {
                [classes.emptyCell]: !value,
                [classes.nowrap]: cellValueShouldNotWrap(header),
                [classes.undefinedCell]: isUndefined,
            },
            'bordered'
        )}
        backgroundColor={
            legendStyle === 'FILL'
                ? getColorByValueFromLegendSet(header.legendSet, value)
                : undefined
        }
        dataTest="table-cell"
    >
        <div
            style={
                legendStyle === 'TEXT'
                    ? {
                          color: getColorByValueFromLegendSet(
                              header.legendSet,
                              value
                          ),
                      }
                    : {}
            }
        >
            {formatCellValue(value, header)}
        </div>
    </DataTableCell>
)

type BodyCellProps = TableCellProps & {
    columnIndex: number
    rowContext: LineListAnalyticsData['rowContext']
    rowIndex: number
}

export const BodyCell = ({
    rowContext,
    rowIndex,
    columnIndex,
    ...tabelCellProps
}: BodyCellProps) => {
    if (!cellIsUndefined(rowContext, rowIndex, columnIndex)) {
        return <TableCell {...tabelCellProps} />
    }

    return (
        <Tooltip content={i18n.t('No event')}>
            {(tooltipProps) => (
                <TableCell
                    {...tabelCellProps}
                    isUndefined={true}
                    tooltipProps={tooltipProps}
                />
            )}
        </Tooltip>
    )
}
