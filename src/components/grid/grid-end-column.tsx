import type { FC, ReactNode } from 'react'
import classes from './styles/grid.module.css'

export const GridEndColumn: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.endColumn} data-test="grid-end-column">
        {children}
    </div>
)
