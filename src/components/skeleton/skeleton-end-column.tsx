import React, { type FC, type ReactNode } from 'react'
import classes from './skeleton-end-column.module.css'

export const SkeletonEndColumn: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="skeleton-end-column">
        {children}
    </div>
)
