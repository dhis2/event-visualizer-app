import type { FC, ReactNode } from 'react'
import classes from './styles/app-layout-canvas.module.css'

export const AppLayoutCanvas: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="app-layout-canvas">
        {children}
    </div>
)
