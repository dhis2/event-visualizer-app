import i18n from '@dhis2/d2-i18n'
import { DataTableColumnHeader } from '@dhis2/ui'
import cx from 'classnames'
import { useCallback, useMemo, type FC } from 'react'
import classes from './styles/header-cell.module.css'
import type { ColumnHeaderClickFn, DataSortFn, LineListHeader } from './types'
import type { SortDirection } from '@types'

type HeaderCellProps = LineListHeader & {
    isDisconnected: boolean
    onDataSort: DataSortFn
    onColumnHeaderClick?: ColumnHeaderClickFn
    sortDirection?: SortDirection
    sortField?: string
}

type UiSortDirection = 'asc' | 'desc' | 'default'
type HandleSortIconClickPayload = {
    name: string
    direction: UiSortDirection
}

export const HeaderCell: FC<HeaderCellProps> = ({
    name,
    dimensionId,
    displayText,
    isDisconnected,
    onDataSort,
    onColumnHeaderClick,
    sortDirection,
    sortField,
}) => {
    const headerSortDirection = useMemo((): UiSortDirection | undefined => {
        if (isDisconnected) {
            return undefined
        } else if (
            name === sortField &&
            (sortDirection === 'ASC' || sortDirection === 'DESC')
        ) {
            return sortDirection.toLowerCase() as UiSortDirection
        } else {
            return 'default'
        }
    }, [name, isDisconnected, sortDirection, sortField])
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
        <DataTableColumnHeader
            className={cx(classes.headerCell, 'bordered')}
            key={name}
            name={name}
            onSortIconClick={isDisconnected ? undefined : handleSortIconClick}
            sortDirection={headerSortDirection}
            sortIconTitle={
                isDisconnected
                    ? undefined
                    : i18n.t('Sort by "{{column}}" and update', {
                          column: displayText,
                      })
            }
            dataTest="data-table-header"
        >
            <span
                className={cx(
                    classes.headerCell,
                    classes.dimensionModalHandler
                )}
                onClick={
                    onColumnHeaderClick
                        ? () => {
                              onColumnHeaderClick(dimensionId)
                          }
                        : undefined
                }
            >
                {displayText}
            </span>
        </DataTableColumnHeader>
    )
}
