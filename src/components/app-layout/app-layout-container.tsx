import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-container.module.css'

export const AppLayoutContainer: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="app-layout-container">
        {children}
    </div>
)
