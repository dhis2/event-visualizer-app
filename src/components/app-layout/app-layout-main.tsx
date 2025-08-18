import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-main.module.css'

export const AppLayoutMain: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="app-layout-main">
        {children}
    </div>
)
