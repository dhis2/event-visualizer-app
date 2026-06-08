import { forwardRef, useImperativeHandle, useState } from 'react'
import classes from './styles/update-sync-icon.module.css'

export type UpdateSyncIconHandle = {
    play: () => void
}

/* play() bumps runId, which is the group's key. Changing the key remounts the
 * group, which restarts the spin from the start — even if it's still spinning. */
export const UpdateSyncIcon = forwardRef<UpdateSyncIconHandle>(
    function UpdateSyncIcon(_props, ref) {
        const [runId, setRunId] = useState(-1)

        useImperativeHandle(
            ref,
            () => ({ play: () => setRunId((id) => id + 1) }),
            []
        )

        const isPlaying = runId >= 0

        return (
            <svg
                className={classes.icon}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                focusable="false"
                data-test="update-sync-icon"
            >
                <g
                    key={runId}
                    className={isPlaying ? classes.run : undefined}
                    data-test="update-sync-icon-spinner"
                >
                    <rect
                        className={classes.ring}
                        x="3.5"
                        y="1.5"
                        width="9"
                        height="13"
                        rx="2"
                        pathLength="100"
                    />
                    <path className={classes.head} d="M0.5 7L3.5 4L6.5 7" />
                    <path className={classes.head} d="M9.5 9L12.5 12L15.5 9" />
                </g>
            </svg>
        )
    }
)
