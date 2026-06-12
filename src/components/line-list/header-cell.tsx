import i18n from '@dhis2/d2-i18n'
import type { SortDirection } from '@types'
import cx from 'classnames'
import { useCallback, useMemo, type FC } from 'react'
import { Sorter, type UiSortDirection } from './sorter'
import classes from './styles/header-cell.module.css'
import type { ColumnHeaderClickFn, DataSortFn, LineListHeader } from './types'

type HeaderCellProps = LineListHeader & {
    isDisconnected: boolean
    onDataSort: DataSortFn
    onColumnHeaderClick?: ColumnHeaderClickFn
    sortDirection?: SortDirection
    sortField?: string
}

type SortIconClickPayload = {
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
    const uiSortDirection = useMemo((): UiSortDirection | undefined => {
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
        ({ name, direction: uiSortDirection }: SortIconClickPayload) => {
            const direction =
                uiSortDirection === 'asc' || uiSortDirection === 'desc'
                    ? (uiSortDirection.toUpperCase() as SortDirection)
                    : undefined
            onDataSort({ dimension: name, direction })
        },
        [onDataSort]
    )

    return (
        <th
            scope="col"
            className={classes.headerCell}
            data-test="data-table-header"
        >
            <div className={classes.inner}>
                <span
                    className={cx(classes.label, classes.dimensionModalHandler)}
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
                {uiSortDirection !== undefined && (
                    <Sorter
                        name={name}
                        sortDirection={uiSortDirection}
                        title={i18n.t('Sort by "{{- column}}" and update', {
                            column: displayText,
                        })}
                        onClick={handleSortIconClick}
                    />
                )}
            </div>
        </th>
    )
}
