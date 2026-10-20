import type { FC } from 'react'
import classes from './styles/layout-blocked-overlay.module.css'

/* Covers whatever it is placed in — the whole axes container, or a single axis
 * that is refusing a drag the others accept. The message is omitted in the
 * latter case, where there is no room for it. */
export const LayoutBlockedOverlay: FC<{ message?: string }> = ({ message }) => (
    <div
        className={classes.layoutBlockedOverlay}
        data-test="layout-blocked-overlay"
    >
        {message && (
            <div className={classes.layoutBlockedMessage}>{message}</div>
        )}
    </div>
)
