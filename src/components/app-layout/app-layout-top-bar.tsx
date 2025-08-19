import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-top-bar.module.css'

export const AppLayoutTopBar: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="app-layout-top-bar">
        {children}
    </div>
)
