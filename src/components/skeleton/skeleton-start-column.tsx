import type { FC, ReactNode } from 'react'
import classes from './skeleton-start-column.module.css'

export const SkeletonStartColumn: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="skeleton-start-column">
        {children}
    </div>
)
