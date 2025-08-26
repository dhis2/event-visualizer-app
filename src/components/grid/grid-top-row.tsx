import type { FC, ReactNode } from 'react'
import classes from './styles/grid.module.css'

export const GridTopRow: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.topRow} data-test="grid-top-row">
        {children}
    </div>
)
