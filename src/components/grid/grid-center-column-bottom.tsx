import type { FC, ReactNode } from 'react'
import classes from './styles/grid.module.css'

export const GridCenterColumnBottom: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div
        className={classes.centerColumnBottom}
        data-test="grid-center-column-bottom"
    >
        {children}
    </div>
)
