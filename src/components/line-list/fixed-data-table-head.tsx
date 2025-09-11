import i18n from '@dhis2/d2-i18n'
import { DataTableHead, DataTableRow, DataTableColumnHeader } from '@dhis2/ui'
import { useCallback, type FC } from 'react'
import type { DataSortFn, LineListAnalyticsData } from './types'
import type { GridHeader, SortDirection } from '@types'

type FixedDataTableHeadProps = {
    headers: LineListAnalyticsData['headers']
    isDisconnected: boolean
    onDataSort: DataSortFn
    sortDirection?: SortDirection
    sortField?: string
}

type UiSortDirection = 'asc' | 'desc' | 'default'
type HandleSortIconClickPayload = {
    name: string
    direction: UiSortDirection
}

const isStageOffsetInteger = (stageOffset: unknown): stageOffset is number =>
    Number.isInteger(stageOffset)

const getHeaderText = ({ stageOffset, column }: Partial<GridHeader> = {}) => {
    if (!column) {
        return ''
    }

    if (isStageOffsetInteger(stageOffset)) {
        let repetitionSuffix

        if (stageOffset === 0) {
            repetitionSuffix = i18n.t('most recent')
        } else if (stageOffset === 1) {
            repetitionSuffix = i18n.t('oldest')
        } else if (stageOffset > 1) {
            repetitionSuffix = i18n.t('oldest {{repeatEventIndex}}', {
                repeatEventIndex: `+${stageOffset - 1}`,
            })
        } else if (stageOffset < 0) {
            repetitionSuffix = i18n.t('most recent {{repeatEventIndex}}', {
                repeatEventIndex: stageOffset,
            })
        }

        return `${column} (${repetitionSuffix})`
    }

    return column
}

export const FixedDataTableHead: FC<FixedDataTableHeadProps> = ({
    headers,
    isDisconnected,
    onDataSort,
    sortDirection,
    sortField,
}) => {
    const getHeaderSortDirection = useCallback(
        (headerName: string = ''): UiSortDirection | undefined => {
            if (isDisconnected) {
                return undefined
            } else if (
                headerName === sortField &&
                (sortDirection === 'ASC' || sortDirection === 'DESC')
            ) {
                return sortDirection.toLowerCase() as UiSortDirection
            } else {
                return 'default'
            }
        },
        [isDisconnected, sortDirection, sortField]
    )
    const handleSortIconClick = useCallback(
        ({ name, direction: uiSortDirection }: HandleSortIconClickPayload) => {
            const direction =
                uiSortDirection === 'asc' || uiSortDirection === 'desc'
                    ? (uiSortDirection.toUpperCase() as SortDirection)
                    : undefined
            onDataSort({ dimension: name, direction })
        },
        [onDataSort]
    )

    return (
        <DataTableHead>
            <DataTableRow>
                {headers.map((header) => (
                    <DataTableColumnHeader
                        fixed
                        top={true}
                        key={header.name}
                        name={header.name}
                        onSortIconClick={handleSortIconClick}
                        sortDirection={getHeaderSortDirection(header.name)}
                        sortIconTitle={i18n.t(
                            'Sort by "{{column}}" and update',
                            {
                                column: getHeaderText(header),
                            }
                        )}
                        dataTest="data-table-header"
                    >
                        {/* TODO: {formatCellHeader(header)} */}
                        {header.name ?? 'Header with no name'}
                    </DataTableColumnHeader>
                ))}
            </DataTableRow>
        </DataTableHead>
    )
}
