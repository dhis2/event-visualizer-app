import type { FC, ReactNode } from 'react'
import classes from './styles/grid.module.css'

export const GridStartColumn: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.startColumn} data-test="grid-start-column">
        {children}
    </div>
)
