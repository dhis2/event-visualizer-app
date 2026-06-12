import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import type { FC } from 'react'
import classes from './styles/sorter.module.css'

export type UiSortDirection = 'asc' | 'desc' | 'default'

const NEXT_SORT_DIRECTION: Record<UiSortDirection, UiSortDirection> = {
    default: 'asc',
    asc: 'desc',
    desc: 'default',
}

type SortIconClickPayload = {
    name: string
    direction: UiSortDirection
}

type SorterProps = {
    name: string
    sortDirection: UiSortDirection
    title?: string
    onClick: (payload: SortIconClickPayload) => void
}

export const Sorter: FC<SorterProps> = ({
    name,
    sortDirection,
    title,
    onClick,
}) => (
    <button
        type="button"
        className={classes.action}
        title={title ?? i18n.t('Sort items')}
        onClick={() =>
            onClick({ name, direction: NEXT_SORT_DIRECTION[sortDirection] })
        }
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className={cx(classes.icon, sortDirection)}
        >
            <g fill="none" fillRule="evenodd">
                <polygon className={classes.top} points="4 9 12 9 8 14" />
                <polygon className={classes.bottom} points="4 7 12 7 8 2" />
            </g>
        </svg>
    </button>
)
