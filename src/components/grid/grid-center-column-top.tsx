import type { FC, ReactNode } from 'react'
import classes from './styles/grid.module.css'

export const GridCenterColumnTop: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.centerColumnTop} data-test="grid-center-column-top">
        {children}
    </div>
)
