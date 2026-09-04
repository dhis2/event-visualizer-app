import { parseEngineError } from '@api/parse-engine-error'
import { FetchError } from '@dhis2/app-runtime'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import type { FC } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { CanvasError } from './canvas-error'

/* Renders the errors that belong on the canvas — a fetch failure or an empty
 * response — and re-throws everything else so the shell error boundary shows a
 * reload screen. Retry (`resetErrorBoundary`) remounts the plugin, re-running
 * the fetch. */
export const CanvasErrorFallback: FC<FallbackProps> = ({
    error,
    resetErrorBoundary,
}) => {
    if (error instanceof EmptyResponseError) {
        return <CanvasError error={error} onRetry={resetErrorBoundary} />
    }

    if (error instanceof FetchError) {
        return (
            <CanvasError
                error={parseEngineError(error)}
                onRetry={resetErrorBoundary}
            />
        )
    }

    throw error
}
