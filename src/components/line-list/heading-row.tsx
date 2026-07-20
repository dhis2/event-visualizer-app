import { DataTableColumnHeader, DataTableRow } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import headerClasses from './styles/header-cell.module.css'
import classes from './styles/heading-row.module.css'

type HeadingRowProps = {
    text: string
    colSpan: number
}

export const HeadingRow: FC<HeadingRowProps> = ({ text, colSpan }) => (
    <DataTableRow>
        <DataTableColumnHeader
            colSpan={colSpan.toString()}
            className={cx(
                headerClasses.headerCell,
                classes.headingCell,
                'bordered'
            )}
        >
            <span className={classes.heading}>{text}</span>
        </DataTableColumnHeader>
    </DataTableRow>
)
