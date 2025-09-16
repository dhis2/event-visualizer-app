import i18n from '@dhis2/d2-i18n'
import { DataTableColumnHeader } from '@dhis2/ui'
import cx from 'classnames'
import { useCallback, useMemo, type FC } from 'react'
import classes from './styles/header-cell.module.css'
import type { ColumnHeaderClickFn, DataSortFn } from './types'
import type { GridHeader, SortDirection } from '@types'

type HeaderCellProps = {
    fontSizeClass: string
    header: GridHeader
    isDisconnected: boolean
    onDataSort: DataSortFn
    sizeClass: string
    onColumnHeaderClick?: ColumnHeaderClickFn
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

export const HeaderCell: FC<HeaderCellProps> = ({
    fontSizeClass,
    header,
    isDisconnected,
    onDataSort,
    sizeClass,
    onColumnHeaderClick,
    sortDirection,
    sortField,
}) => {
    const headerSortDirection = useMemo((): UiSortDirection | undefined => {
        if (isDisconnected) {
            return undefined
        } else if (
            header.name === sortField &&
            (sortDirection === 'ASC' || sortDirection === 'DESC')
        ) {
            return sortDirection.toLowerCase() as UiSortDirection
        } else {
            return 'default'
        }
    }, [header, isDisconnected, sortDirection, sortField])
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
    const headerText = useMemo(() => {
        const { column, stageOffset } = header

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
    }, [header])
    const headerName = useMemo(
        () =>
            isStageOffsetInteger(header.stageOffset)
                ? headerText.replace(/\[-?\d+\]/, '')
                : headerText,
        [header.stageOffset, headerText]
    )

    return (
        <DataTableColumnHeader
            fixed
            top={true}
            className={cx(
                classes.headerCell,
                fontSizeClass,
                sizeClass,
                'bordered'
            )}
            key={header.name}
            name={header.name}
            onSortIconClick={handleSortIconClick}
            sortDirection={headerSortDirection}
            sortIconTitle={i18n.t('Sort by "{{column}}" and update', {
                column: headerText,
            })}
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
                              onColumnHeaderClick(headerName)
                          }
                        : undefined
                }
            >
                {headerText}
            </span>
        </DataTableColumnHeader>
    )
}
