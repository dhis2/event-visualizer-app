import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-center-column.module.css'

export const AppLayoutCenterColumn: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="app-layout-center-column">
        {children}
    </div>
)
