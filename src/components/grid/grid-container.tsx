import type { FC, ReactNode } from 'react'
import classes from './styles/grid.module.css'

export const GridContainer: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="grid-container">
        {children}
    </div>
)
