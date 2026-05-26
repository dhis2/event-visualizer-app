import { NoticeBox } from '@dhis2/ui'
import type { FC } from 'react'

type CardDisabledNoticeProps = {
    message: string
}

export const CardDisabledNotice: FC<CardDisabledNoticeProps> = ({
    message,
}) => (
    <div data-test="card-disabled-notice">
        <NoticeBox warning dense>
            {message}
        </NoticeBox>
    </div>
)
