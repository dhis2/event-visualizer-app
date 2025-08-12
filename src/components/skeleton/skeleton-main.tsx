import React, { type FC, type ReactNode } from 'react'
import classes from './skeleton-main.module.css'

export const SkeletonMain: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="skeleton-main">
        {children}
    </div>
)
