import type { FC, ReactNode } from 'react'
import classes from './skeleton-center-column-top.module.css'

export const SkeletonCenterColumnTop: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="skeleton-center-column-top">
        {children}
    </div>
)
