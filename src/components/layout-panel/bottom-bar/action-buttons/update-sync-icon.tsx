import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/update-sync-icon.module.css'

type UpdateSyncIconProps = {
    isAnimating: boolean
}

export const UpdateSyncIcon: FC<UpdateSyncIconProps> = ({ isAnimating }) => (
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
            className={cx({ [classes.run]: isAnimating })}
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
