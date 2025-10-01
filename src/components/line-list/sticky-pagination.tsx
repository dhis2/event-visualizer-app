import i18n from '@dhis2/d2-i18n'
import { Tooltip, Pagination } from '@dhis2/ui'
import { useCallback } from 'react'
import { useScrollBoxWidth } from './scroll-box'
import classes from './styles/sticky-navigation.module.css'
import type { LineListPager, PaginateFn } from './types'

type StickyPaginationWithConditionalTooltipProps = LineListPager & {
    colSpan: number
    isDisconnected: boolean
    isFetching: boolean
    onPaginate: PaginateFn
    pageLength: number
}

type StickyPaginationProps = Omit<
    StickyPaginationWithConditionalTooltipProps,
    'isFetching' | 'isDisconnected'
> & {
    disabled: boolean
    tooltipProps?: object
}

const StickyPagination = ({
    colSpan,
    disabled,
    isLastPage,
    onPaginate,
    page,
    pageLength,
    pageSize,
    tooltipProps,
}: StickyPaginationProps) => {
    const scrollboxWidth = useScrollBoxWidth()
    const onPageChange = useCallback(
        (page: number) => {
            onPaginate({ page })
        },
        [onPaginate]
    )
    const onPageSizeChange = useCallback(
        (pageSize: number) => {
            onPaginate({ page: 1, pageSize })
        },
        [onPaginate]
    )
    return (
        <td colSpan={colSpan} className={classes.footerCell}>
            <div
                className={classes.stickyContainer}
                style={{
                    maxWidth: scrollboxWidth,
                }}
                data-test="sticky-pagination-container"
                {...tooltipProps}
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
        </td>
    )
}

const StickyPaginationWithConditionalTooltip = ({
    isFetching,
    isDisconnected,
    ...props
}: StickyPaginationWithConditionalTooltipProps) => {
    const disabled = isFetching || isDisconnected

    if (isDisconnected) {
        return (
            <Tooltip content={i18n.t('Not available offline')}>
                {(tooltipProps) => (
                    <StickyPagination
                        disabled={disabled}
                        {...props}
                        tooltipProps={tooltipProps}
                    />
                )}
            </Tooltip>
        )
    }

    return <StickyPagination disabled={disabled} {...props} />
}

export { StickyPaginationWithConditionalTooltip as StickyPagination }
