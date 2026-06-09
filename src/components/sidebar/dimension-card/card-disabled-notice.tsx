import { IconInfo16 } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/card-disabled-notice.module.css'

type CardDisabledNoticeProps = {
    message: string
}

export const CardDisabledNotice: FC<CardDisabledNoticeProps> = ({
    message,
}) => (
    <div className={classes.notice} data-test="card-disabled-notice">
        <span className={classes.icon}>
            <IconInfo16 />
        </span>
        <span className={classes.message}>{message}</span>
    </div>
)
