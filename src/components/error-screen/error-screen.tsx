import type { EngineError } from '@api/parse-engine-error'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/error-screen.module.css'

type ErrorScreenProps = {
    error: EngineError
}

export const ErrorScreen: FC<ErrorScreenProps> = ({ error }) => (
    <div className={classes.container}>
        <NoticeBox error title={i18n.t('An error occurred')}>
            {error.message}
        </NoticeBox>
    </div>
)
