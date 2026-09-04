import type { EngineError } from '@api/parse-engine-error'
import i18n from '@dhis2/d2-i18n'
import { Button, NoticeBox } from '@dhis2/ui'
import type { EmptyResponseError } from '@modules/error/empty-response-error'
import { getErrorDisplay } from '@modules/error/get-error-display'
import type { FC } from 'react'
import classes from './styles/canvas-error.module.css'

type CanvasErrorProps = {
    error: EngineError | EmptyResponseError
    onRetry?: () => void
}

export const CanvasError: FC<CanvasErrorProps> = ({ error, onRetry }) => {
    const { title, description, retryable, severity } = getErrorDisplay(error)

    return (
        <div className={classes.container}>
            <NoticeBox error={severity === 'error'} title={title}>
                {description}
            </NoticeBox>
            {retryable && onRetry && (
                <div className={classes.actions}>
                    <Button onClick={onRetry}>{i18n.t('Retry')}</Button>
                </div>
            )}
        </div>
    )
}
