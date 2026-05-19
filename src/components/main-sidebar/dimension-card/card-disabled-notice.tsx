import { NoticeBox } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/card-disabled-notice.module.css'

type CardDisabledNoticeProps = {
    message: string
}

export const CardDisabledNotice: FC<CardDisabledNoticeProps> = ({
    message,
}) => (
    <div className={classes.container} data-test="card-disabled-notice">
        <NoticeBox warning>{message}</NoticeBox>
    </div>
)
