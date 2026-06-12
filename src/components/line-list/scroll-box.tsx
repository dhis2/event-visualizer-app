import type { FC, ReactNode } from 'react'
import classes from './styles/scroll-box.module.css'

export const ScrollBox: FC<{ children?: ReactNode }> = ({ children }) => (
    <div className={classes.container} data-test="scroll-box-container">
        <div className={classes.content} data-test="scroll-box-content">
            {children}
        </div>
    </div>
)
