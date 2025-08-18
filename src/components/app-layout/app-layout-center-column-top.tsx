import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-center-column-top.module.css'

export const AppLayoutCenterColumnTop: FC<{ children?: ReactNode }> = ({
    children,
}) => (
    <div className={classes.container} data-test="app-layout-center-column-top">
        {children}
    </div>
)
