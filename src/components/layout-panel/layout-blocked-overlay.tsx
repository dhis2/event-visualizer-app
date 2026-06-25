import type { FC } from 'react'
import classes from './styles/layout-blocked-overlay.module.css'

export const LayoutBlockedOverlay: FC<{ message: string }> = ({ message }) => (
    <div
        className={classes.layoutBlockedOverlay}
        data-test="layout-blocked-overlay"
    >
        <div className={classes.layoutBlockedMessage}>{message}</div>
    </div>
)
