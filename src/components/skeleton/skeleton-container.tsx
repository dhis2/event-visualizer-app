import React, { type FC, type ReactNode } from 'react'
import classes from './skeleton-container.module.css'

export const SkeletonContainer: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="skeleton-container">
        {children}
    </div>
)
