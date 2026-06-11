import { isAction } from '@reduxjs/toolkit'
import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import type { AppCachedData } from '@types'

type AppCachedDataMeta = { appCachedData: AppCachedData }

/* Stamps the session's appCachedData onto every action's meta, making it
 * reachable from reducers (which cannot see the thunk extraArgument). Read it
 * back with getAppCachedDataFromAction. */
export const createAppCachedDataMiddleware =
    (appCachedData: AppCachedData): Middleware =>
    () =>
    (next) =>
    (action) => {
        if (!isAction(action)) {
            return next(action)
        }
        const existingMeta = (action as { meta?: object }).meta
        const meta: AppCachedDataMeta = { ...existingMeta, appCachedData }
        return next({ ...action, meta })
    }

export const getAppCachedDataFromAction = (
    action: { meta?: Partial<AppCachedDataMeta> } | UnknownAction
): AppCachedData | undefined =>
    (action as { meta?: Partial<AppCachedDataMeta> }).meta?.appCachedData
