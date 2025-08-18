import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-start-column.module.css'

export const AppLayoutStartColumn: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="app-layout-start-column">
        {children}
    </div>
)
