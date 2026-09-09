import type { EngineError } from '@api/parse-engine-error'
import { IconErrorData } from '@assets/icon-error-data'
import { IconErrorEmptyBox } from '@assets/icon-error-empty-box'
import { IconErrorGeneric } from '@assets/icon-error-generic'
import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import type { CanvasErrorIcon } from '@modules/error/canvas-error-icon'
import type { EmptyResponseError } from '@modules/error/empty-response-error'
import { getErrorDisplay } from '@modules/error/get-error-display'
import type { FC } from 'react'
import classes from './styles/canvas-error.module.css'

type CanvasErrorProps = {
    error: EngineError | EmptyResponseError
    onRetry?: () => void
}

const ICONS: Record<CanvasErrorIcon, FC> = {
    emptyBox: IconErrorEmptyBox,
    data: IconErrorData,
    generic: IconErrorGeneric,
}

export const CanvasError: FC<CanvasErrorProps> = ({ error, onRetry }) => {
    const { icon, title, description, retryable } = getErrorDisplay(error)
    const Icon = ICONS[icon]

    return (
        <div className={classes.outer}>
            <div className={classes.inner} data-test="canvas-error">
                <div
                    className={classes.icon}
                    data-test={`canvas-error-icon-${icon}`}
                >
                    <Icon />
                </div>
                <p className={classes.title}>{title}</p>
                <p className={classes.description}>{description}</p>
                {retryable && onRetry && (
                    <div className={classes.actions}>
                        <Button onClick={onRetry}>{i18n.t('Retry')}</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
