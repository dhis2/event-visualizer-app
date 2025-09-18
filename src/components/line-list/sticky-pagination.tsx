import i18n from '@dhis2/d2-i18n'
import { DataTableCell, Tooltip, Pagination } from '@dhis2/ui'
import { useCallback } from 'react'
import { useScrollBoxWidth } from './scroll-box'
import classes from './styles/sticky-navigation.module.css'
import type { LineListPager, PaginateFn } from './types'

type StickyPaginationProps = LineListPager & {
    colSpan: string
    isDisconnected: boolean
    isFetching: boolean
    onPaginate: PaginateFn
    pageLength: number
}

const StickyPagination = ({
    colSpan,
    disabled,
    isLastPage,
    onPaginate,
    page,
    pageLength,
    pageSize,
}: Omit<StickyPaginationProps, 'isFetching' | 'isDisconnected'> & {
    disabled: boolean
}) => {
    const scrollboxWidth = useScrollBoxWidth()
    const onPageChange = useCallback(
        (page: number) => {
            onPaginate({ page })
        },
        [onPaginate]
    )
    const onPageSizeChange = useCallback(
        (pageSize: number) => {
            onPaginate({ pageSize })
        },
        [onPaginate]
    )
    return (
        <DataTableCell
            colSpan={colSpan}
            staticStyle
            className={classes.footerCell}
        >
            <div
                className={classes.stickyContainer}
                style={{
                    maxWidth: scrollboxWidth,
                }}
            >
                <Pagination
                    disabled={disabled}
                    page={page}
                    pageSize={pageSize}
                    isLastPage={isLastPage}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    pageSizeSelectText={i18n.t('Rows per page')}
                    pageLength={pageLength}
                    pageSummaryText={({ firstItem, lastItem, page }) =>
                        i18n.t(
                            'Page {{page}}, row {{firstItem}}-{{lastItem}}',
                            {
                                firstItem,
                                lastItem,
                                page,
                            }
                        )
                    }
                />
            </div>
        </DataTableCell>
    )
}

const StickyPaginationWithConditionalTooltip = ({
    isFetching,
    isDisconnected,
    ...props
}: StickyPaginationProps) => {
    const disabled = isFetching || isDisconnected

    if (isDisconnected) {
        return (
            <Tooltip content={i18n.t('Not available offline')}>
                <StickyPagination disabled={disabled} {...props} />
            </Tooltip>
        )
    }

    return <StickyPagination disabled={disabled} {...props} />
}

export { StickyPaginationWithConditionalTooltip as StickyPagination }
