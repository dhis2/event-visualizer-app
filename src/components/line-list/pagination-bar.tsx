import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconChevronLeft16,
    IconChevronRight16,
    IconMore16,
    Popover,
    SingleSelectField,
    SingleSelectOption,
    Tooltip,
} from '@dhis2/ui'
import type { OutputType } from '@types'
import cx from 'classnames'
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type FC,
    type KeyboardEvent,
} from 'react'
import { useScrollBoxWidth } from './scroll-box'
import classes from './styles/pagination-bar.module.css'
import stickyClasses from './styles/sticky-navigation.module.css'
import type { LineListPager, PaginateFn } from './types'

/* Rapid prev/next clicks only update the displayed page; the request fires
 * once the clicks pause, so skipping ahead five pages costs one request. */
const NAVIGATION_DEBOUNCE_MS = 250
const PAGE_SIZES = [5, 10, 15, 20, 25, 50, 100]

/* Programs and tracked entity types can rename these (e.g. "persons"); the
 * prototype only uses the standard terms. */
const formatCount = (count: number, outputType?: OutputType): string => {
    const formattedCount = count.toLocaleString()
    const isSingular = count === 1
    switch (outputType) {
        case 'EVENT':
            return isSingular
                ? i18n.t('1 event')
                : i18n.t('{{formattedCount}} events', { formattedCount })
        case 'ENROLLMENT':
            return isSingular
                ? i18n.t('1 enrollment')
                : i18n.t('{{formattedCount}} enrollments', { formattedCount })
        case 'TRACKED_ENTITY_INSTANCE':
            return isSingular
                ? i18n.t('1 tracked entity')
                : i18n.t('{{formattedCount}} tracked entities', {
                      formattedCount,
                  })
        default:
            return isSingular
                ? i18n.t('1 row')
                : i18n.t('{{formattedCount}} rows', { formattedCount })
    }
}

type PaginationBarProps = {
    colSpan: number
    outputType?: OutputType
    pager: LineListPager
    pageLength: number
    isFetching: boolean
    isDisconnected: boolean
    onPaginate: PaginateFn
}

type TooltipTriggerProps = Record<string, unknown>

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
    outputType,
    pager,
    pageLength,
    isFetching,
    onPaginate,
    disabled,
    tooltipProps,
}) => {
    const scrollBoxWidth = useScrollBoxWidth()
    const { page, pageSize, pageCount, total, isLastPage } = pager
    /* The scroll box reports 0 until its first (debounced) measurement, and
     * capping the footer at 0px would squash it for a frame. */
    const stickyStyle =
        scrollBoxWidth > 0 ? { maxWidth: scrollBoxWidth } : undefined
    const hasTotals = typeof pageCount === 'number'
    const [displayPage, setDisplayPageState] = useState(page)
    /* Read by click handlers, so clicks that land before a re-render still
     * step from the page the previous click moved to. */
    const displayPageRef = useRef(page)
    const setDisplayPage = useCallback((targetPage: number) => {
        displayPageRef.current = targetPage
        setDisplayPageState(targetPage)
    }, [])
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const latestRef = useRef({ page, isFetching })
    latestRef.current = { page, isFetching }

    /* A response resyncs the displayed page, unless the user is mid-way
     * through a burst of clicks that hasn't been requested yet. */
    useEffect(() => {
        if (debounceTimerRef.current === null) {
            setDisplayPage(page)
        }
    }, [pager, page, setDisplayPage])

    useEffect(
        () => () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        },
        []
    )

    const requestPage = useCallback(
        (targetPage: number) => {
            debounceTimerRef.current = null
            const isAlreadyShown =
                targetPage === latestRef.current.page &&
                !latestRef.current.isFetching
            if (!isAlreadyShown) {
                onPaginate({ page: targetPage, pageSize })
            }
        },
        [onPaginate, pageSize]
    )

    const navigate = useCallback(
        (targetPage: number, { immediate = false } = {}) => {
            setDisplayPage(targetPage)
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
                debounceTimerRef.current = null
            }
            if (immediate) {
                requestPage(targetPage)
            } else {
                debounceTimerRef.current = setTimeout(
                    () => requestPage(targetPage),
                    NAVIGATION_DEBOUNCE_MS
                )
            }
        },
        [requestPage, setDisplayPage]
    )

    const onPageSizeChange = useCallback(
        (newPageSize: number) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
                debounceTimerRef.current = null
            }
            setDisplayPage(1)
            onPaginate({ page: 1, pageSize: newPageSize })
        },
        [onPaginate, setDisplayPage]
    )

    const isPrevDisabled = disabled || displayPage <= 1
    const isNextDisabled =
        disabled ||
        (hasTotals
            ? displayPage >= pageCount
            : Boolean(isLastPage) && displayPage === page)

    const isSinglePage = hasTotals
        ? pageCount === 1
        : page === 1 && Boolean(isLastPage)

    if (isSinglePage) {
        return (
            <td colSpan={colSpan} className={stickyClasses.footerCell}>
                <div
                    className={stickyClasses.stickyContainer}
                    style={stickyStyle}
                    {...tooltipProps}
                >
                    <div className={classes.bar}>
                        <span
                            className={classes.rowCount}
                            data-test="pagination-row-count"
                        >
                            {formatCount(pageLength, outputType)}
                        </span>
                        <PageSizeMenu
                            pageSize={pageSize}
                            disabled={disabled}
                            onChange={onPageSizeChange}
                        />
                    </div>
                </div>
            </td>
        )
    }

    return (
        <td colSpan={colSpan} className={stickyClasses.footerCell}>
            <div
                className={cx(stickyClasses.stickyContainer, classes.container)}
                style={stickyStyle}
                {...tooltipProps}
            >
                <div className={classes.bar} data-test="pagination-bar">
                    <div className={classes.navGroup}>
                        <Button
                            small
                            secondary
                            icon={<IconChevronLeft16 />}
                            aria-label={i18n.t('Previous page')}
                            disabled={isPrevDisabled}
                            onClick={() =>
                                navigate(
                                    Math.max(displayPageRef.current - 1, 1)
                                )
                            }
                            dataTest="pagination-previous"
                        />
                        <PageSlot
                            page={displayPage}
                            pageCount={pageCount}
                            disabled={disabled}
                            onCommit={(targetPage) =>
                                navigate(targetPage, { immediate: true })
                            }
                        />
                        <Button
                            small
                            secondary
                            icon={<IconChevronRight16 />}
                            aria-label={i18n.t('Next page')}
                            disabled={isNextDisabled}
                            onClick={() =>
                                navigate(
                                    Math.min(
                                        displayPageRef.current + 1,
                                        pageCount ?? Number.POSITIVE_INFINITY
                                    )
                                )
                            }
                            dataTest="pagination-next"
                        />
                    </div>
                    {typeof total === 'number' && (
                        <span className={classes.rowCount}>
                            {formatCount(total, outputType)}
                        </span>
                    )}
                    <PageSizeMenu
                        pageSize={pageSize}
                        disabled={disabled}
                        onChange={onPageSizeChange}
                    />
                </div>
            </div>
        </td>
    )
}

/* Without totals there is no largest page number to size for, so the slot
 * holds three digits and only grows past page 999. */
const DIGITS_WITHOUT_TOTALS = 3

type PageSlotProps = {
    page: number
    pageCount?: number
    disabled: boolean
    onCommit: (page: number) => void
}

/* With totals, the current page and the page count get identical boxes, sized
 * to the page count's digits and hugging the slash, so "1 / 247" and
 * "247 / 247" take the same space and the next button never moves. */
const PageSlot: FC<PageSlotProps> = ({
    page,
    pageCount,
    disabled,
    onCommit,
}) => {
    const hasTotals = typeof pageCount === 'number'
    const digits = hasTotals
        ? String(pageCount).length
        : Math.max(DIGITS_WITHOUT_TOTALS, String(page).length)
    const numberBoxSize = { inlineSize: `${digits}ch` }

    return (
        <span className={classes.pageSlot}>
            <PageInput
                page={page}
                pageCount={pageCount}
                disabled={disabled}
                className={cx({ [classes.alignEnd]: hasTotals })}
                style={numberBoxSize}
                onCommit={onCommit}
            />
            {hasTotals && (
                <>
                    <span className={classes.slash}>/</span>
                    <span className={classes.pageCount} style={numberBoxSize}>
                        {pageCount}
                    </span>
                </>
            )}
        </span>
    )
}

type PageInputProps = {
    page: number
    pageCount?: number
    disabled: boolean
    className?: string
    style: CSSProperties
    onCommit: (page: number) => void
}

const PageInput: FC<PageInputProps> = ({
    page,
    pageCount,
    disabled,
    className,
    style,
    onCommit,
}) => {
    const [draft, setDraft] = useState<string | null>(null)

    const commit = useCallback(() => {
        if (draft === null) {
            return
        }
        setDraft(null)
        const parsed = Number.parseInt(draft, 10)
        if (Number.isNaN(parsed)) {
            return
        }
        const clamped = Math.min(
            Math.max(parsed, 1),
            pageCount ?? Number.POSITIVE_INFINITY
        )
        if (clamped !== page) {
            onCommit(clamped)
        }
    }, [draft, page, pageCount, onCommit])

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            const input = event.currentTarget
            if (event.key === 'Enter') {
                commit()
                requestAnimationFrame(() => input.select())
            } else if (event.key === 'Escape') {
                setDraft(null)
                input.blur()
            }
        },
        [commit]
    )

    return (
        <input
            className={cx(classes.pageInput, className)}
            style={style}
            type="text"
            inputMode="numeric"
            aria-label={i18n.t('Page number')}
            disabled={disabled}
            value={draft ?? String(page)}
            onFocus={(event) => {
                setDraft(String(page))
                event.currentTarget.select()
            }}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft(event.target.value.replace(/\D/g, ''))
            }
            onKeyDown={onKeyDown}
            onBlur={commit}
            data-test="pagination-page-input"
        />
    )
}

type PageSizeMenuProps = {
    pageSize: number
    disabled: boolean
    onChange: (pageSize: number) => void
}

const PageSizeMenu: FC<PageSizeMenuProps> = ({
    pageSize,
    disabled,
    onChange,
}) => {
    const anchorRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            return
        }
        const onEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }
        document.addEventListener('keydown', onEscape)
        return () => document.removeEventListener('keydown', onEscape)
    }, [isOpen])

    return (
        <div className={classes.menuAnchor} ref={anchorRef}>
            <Button
                small
                secondary
                icon={<IconMore16 />}
                aria-label={i18n.t('Pagination options')}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => setIsOpen((open) => !open)}
                dataTest="pagination-options"
            />
            {isOpen && (
                <Popover
                    reference={anchorRef}
                    placement="top-end"
                    arrow={false}
                    onClickOutside={() => setIsOpen(false)}
                >
                    <div className={classes.pageSizePopover}>
                        <SingleSelectField
                            dense
                            label={i18n.t('Rows per page (view only)')}
                            selected={String(pageSize)}
                            onChange={({ selected }) => {
                                setIsOpen(false)
                                const newPageSize = Number(selected)
                                if (newPageSize !== pageSize) {
                                    onChange(newPageSize)
                                }
                            }}
                            dataTest="pagination-page-size-select"
                        >
                            {PAGE_SIZES.map((size) => (
                                <SingleSelectOption
                                    key={size}
                                    label={String(size)}
                                    value={String(size)}
                                />
                            ))}
                        </SingleSelectField>
                    </div>
                </Popover>
            )}
        </div>
    )
}
