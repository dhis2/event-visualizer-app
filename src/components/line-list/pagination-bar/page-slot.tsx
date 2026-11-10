import cx from 'classnames'
import type { FC } from 'react'
import { PageInput } from './page-input'
import classes from './styles/pagination-bar.module.css'

/* Without totals there is no largest page number to size for, so the slot
 * holds three digits and only grows past page 999. */
const DIGITS_WITHOUT_TOTALS = 3

type PageSlotProps = {
    page: number
    pageCount?: number
    disabled: boolean
    onCommit: (page: number) => void
}

/* With totals, the page input and the page count get boxes of the same width,
 * sized to the page count's digits, so "1 / 247" and "247 / 247" take the
 * same space and the next button never moves. */
export const PageSlot: FC<PageSlotProps> = ({
    page,
    pageCount,
    disabled,
    onCommit,
}) => {
    const hasTotals = pageCount !== undefined
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
