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
    baseQueryMeta?: {
        extra?: {
            [key: string]: unknown
            engine?: DataEngine
        }
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

                console.log('ACTION', action)
                if (!action.meta) {
                    action.meta = {}
                }
                if (!action.meta.baseQueryMeta) {
                    action.meta.baseQueryMeta = {}
                }
                if (!action.meta.baseQueryMeta.extra) {
                    action.meta.baseQueryMeta.extra = {}
                }
                // eslint-disable-next-line
                //@ts-ignore
                action.meta.arg.extra = { engine }
                action.meta.baseQueryMeta.extra.engine = engine
                console.log('Added the engine to action:', action)
            }

            return next(action)
        }
}
