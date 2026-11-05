import { useMetadataStore } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { useScrollBoxWidth } from '@components/line-list/scroll-box'
import type {
    LineListPager,
    PageRequest,
    PagerWithTotals,
    PaginateFn,
} from '@components/line-list/types'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconChevronLeft16,
    IconChevronRight16,
    Tooltip,
} from '@dhis2/ui'
import type { CurrentVisualization } from '@types'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import { PageSizeMenu } from './page-size-menu'
import { PageSlot } from './page-slot'
import { hasTotals, isSinglePage } from './pager'
import { getRowCountText } from './row-count'
import classes from './styles/pagination-bar.module.css'

type PaginationBarProps = {
    colSpan: number
    pager: LineListPager
    pageLength: number
    visualization: CurrentVisualization
    /* The page being loaded, which the bar shows and pages on from */
    pageRequest: PageRequest | null
    isDisconnected: boolean
    onPaginate: PaginateFn
}

type TooltipTriggerProps = Record<string, unknown>

const getRowCount = (
    pager: LineListPager,
    pageLength: number
): number | undefined => {
    if (hasTotals(pager)) {
        return pager.total
    }

    return isSinglePage(pager) ? pageLength : undefined
}

const getPageCount = (
    pager: PagerWithTotals,
    pageRequest: PageRequest | null
): number =>
    pageRequest
        ? Math.ceil(pager.total / pageRequest.pageSize)
        : pager.pageCount

export const PaginationBar: FC<PaginationBarProps> = ({
    isDisconnected,
    ...props
}) =>
    isDisconnected ? (
        <Tooltip content={i18n.t('Not available offline')}>
            {(tooltipProps: TooltipTriggerProps) => (
                <PaginationBarInternal
                    {...props}
                    disabled
                    tooltipProps={tooltipProps}
                />
            )}
        </Tooltip>
    ) : (
        <PaginationBarInternal {...props} disabled={false} />
    )

type PaginationBarInternalProps = Omit<PaginationBarProps, 'isDisconnected'> & {
    disabled: boolean
    tooltipProps?: TooltipTriggerProps
}

const PaginationBarInternal: FC<PaginationBarInternalProps> = ({
    colSpan,
    pager,
    pageLength,
    visualization,
    pageRequest,
    onPaginate,
    disabled,
    tooltipProps,
}) => {
    const scrollBoxWidth = useScrollBoxWidth()
    const metadataStore = useMetadataStore()
    const { page, pageSize } = pageRequest ?? pager
    const pageCount = hasTotals(pager)
        ? getPageCount(pager, pageRequest)
        : undefined
    /* Without totals, only the page in the response is known to be the last */
    const isLastPage = hasTotals(pager)
        ? page >= getPageCount(pager, pageRequest)
        : page === pager.page && pager.isLastPage
    const singlePage = isSinglePage(pager)
    const rowCount = getRowCount(pager, pageLength)

    const goToPage = (targetPage: number) =>
        onPaginate({ page: targetPage, pageSize })

    return (
        <StickyFooterCell
            colSpan={colSpan}
            maxWidth={scrollBoxWidth}
            tooltipProps={tooltipProps}
        >
            <div className={classes.bar} data-test="pagination-bar">
                {!singlePage && (
                    <div className={classes.navGroup}>
                        <Button
                            small
                            secondary
                            className={classes.navButton}
                            icon={<IconChevronLeft16 />}
                            aria-label={i18n.t('Previous page')}
                            disabled={disabled || page <= 1}
                            onClick={() => goToPage(page - 1)}
                            dataTest="pagination-previous"
                        />
                        <PageSlot
                            page={page}
                            pageCount={pageCount}
                            disabled={disabled}
                            onCommit={goToPage}
                        />
                        <Button
                            small
                            secondary
                            className={classes.navButton}
                            icon={<IconChevronRight16 />}
                            aria-label={i18n.t('Next page')}
                            disabled={disabled || isLastPage}
                            onClick={() => goToPage(page + 1)}
                            dataTest="pagination-next"
                        />
                    </div>
                )}
                {rowCount !== undefined && (
                    <span
                        className={classes.rowCount}
                        data-test="pagination-row-count"
                    >
                        {getRowCountText(
                            rowCount,
                            visualization,
                            metadataStore
                        )}
                    </span>
                )}
                <PageSizeMenu
                    pageSize={pageSize}
                    disabled={disabled}
                    onChange={(newPageSize) =>
                        onPaginate({ page: 1, pageSize: newPageSize })
                    }
                />
            </div>
        </StickyFooterCell>
    )
}

type StickyFooterCellProps = {
    colSpan: number
    maxWidth: number
    tooltipProps?: TooltipTriggerProps
    children: ReactNode
}

/* The cell spans the whole table, and its content sticks to the visible part
 * of it while the table scrolls sideways. */
const StickyFooterCell: FC<StickyFooterCellProps> = ({
    colSpan,
    maxWidth,
    tooltipProps,
    children,
}) => (
    <td colSpan={colSpan} className={classes.footerCell}>
        <div
            className={cx(classes.stickyContainer, classes.container)}
            /* The scroll box reports 0 until its first measurement, and a
             * 0px cap would squash the bar for a frame. */
            style={maxWidth > 0 ? { maxWidth } : undefined}
            data-test="sticky-pagination-container"
            {...tooltipProps}
        >
            {children}
        </div>
    </td>
)
