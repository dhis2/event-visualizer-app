import React, { type FC, type ReactNode } from 'react'
import classes from './skeleton-top-bar.module.css'

export const SkeletonTopBar: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="skeleton-top-bar">
        {children}
    </div>
)
