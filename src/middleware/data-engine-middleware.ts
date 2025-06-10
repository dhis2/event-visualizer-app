import type { ContextType } from '@dhis2/app-service-data'
import type { Middleware } from '@reduxjs/toolkit/react'
import type { Dispatch, UnknownAction } from 'redux'

type DataEngine = ContextType['engine']

interface RTKQueryMeta {
    arg?: {
        endpointName?: string
        type?: 'query' | 'mutation'
        [key: string]: unknown
    }
    [key: string]: unknown
}

// Narrowed action type with required meta
interface RTKQueryAction extends UnknownAction {
    meta: RTKQueryMeta
}

// Type guard to narrow UnknownAction to RTKQueryAction
function isRTKQueryAction(action: UnknownAction): action is RTKQueryAction {
    if (typeof action !== 'object' || action === null) {
        return false
    }

    const maybeWithMeta = action as unknown as { meta?: unknown }

    if (typeof maybeWithMeta.meta !== 'object' || maybeWithMeta.meta === null) {
        return false
    }

    const meta = maybeWithMeta.meta as RTKQueryMeta
    return typeof meta.arg?.endpointName === 'string'
}

export const createDataEngineMiddleware = (
    getEngine: () => DataEngine
): Middleware => {
    return () =>
        (next: Dispatch<UnknownAction>) =>
        (action: UnknownAction): unknown => {
            if (isRTKQueryAction(action)) {
                const engine = getEngine()

                action.meta = {
                    ...action.meta,
                    engine,
                }
            }

            return next(action)
        }
}
