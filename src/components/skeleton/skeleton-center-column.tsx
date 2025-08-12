import React, { type FC, type ReactNode } from 'react'
import classes from './skeleton-center-column.module.css'

export const SkeletonCenterColumn: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="skeleton-center-column">
        {children}
    </div>
)
