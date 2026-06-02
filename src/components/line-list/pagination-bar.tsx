import i18n from '@dhis2/d2-i18n'
import { Tooltip } from '@dhis2/ui'
import { useCallback } from 'react'
import { SimplePagination } from './simple-pagination'
import classes from './styles/pagination-bar.module.css'
import type { LineListPager, PaginateFn } from './types'

type PaginationBarWithConditionalTooltipProps = LineListPager & {
    isDisconnected: boolean
    isFetching: boolean
    onPaginate: PaginateFn
    pageLength: number
}

type PaginationBarProps = Omit<
    PaginationBarWithConditionalTooltipProps,
    'isFetching' | 'isDisconnected'
> & {
    disabled: boolean
    tooltipProps?: object
}

const PaginationBar = ({
    disabled,
    isLastPage,
    onPaginate,
    page,
    pageLength,
    pageSize,
    tooltipProps,
}: PaginationBarProps) => {
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
        <div
            className={classes.bar}
            data-test="sticky-pagination-container"
            {...tooltipProps}
        >
            <SimplePagination
                disabled={disabled}
                page={page}
                pageSize={pageSize}
                isLastPage={isLastPage}
                pageLength={pageLength}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    )
}

const PaginationBarWithConditionalTooltip = ({
    isFetching,
    isDisconnected,
    ...props
}: PaginationBarWithConditionalTooltipProps) => {
    const disabled = isFetching || isDisconnected

    if (isDisconnected) {
        return (
            <Tooltip content={i18n.t('Not available offline')}>
                {(tooltipProps) => (
                    <PaginationBar
                        disabled={disabled}
                        {...props}
                        tooltipProps={tooltipProps}
                    />
                )}
            </Tooltip>
        )
    }

    return <PaginationBar disabled={disabled} {...props} />
}

export { PaginationBarWithConditionalTooltip as PaginationBar }
