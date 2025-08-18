import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-end-column.module.css'

export const AppLayoutEndColumn: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="app-layout-end-column">
        {children}
    </div>
)
