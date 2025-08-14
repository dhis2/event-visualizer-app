import type { FC, ReactNode } from 'react'
import classes from './skeleton-canvas.module.css'

export const SkeletonCanvas: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="skeleton-canvas">
        {children}
    </div>
)
