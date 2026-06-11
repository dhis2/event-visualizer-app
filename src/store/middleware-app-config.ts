import { isAction } from '@reduxjs/toolkit'
import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import type { AppCachedData } from '@types'

type AppConfigMeta = { appCachedData: AppCachedData }

/* Stamps the session's appCachedData onto every action's meta, making it
 * reachable from reducers (which cannot see the thunk extraArgument). Read it
 * back with getAppCachedData. */
export const createAppConfigMiddleware =
    (appCachedData: AppCachedData): Middleware =>
    () =>
    (next) =>
    (action) => {
        if (!isAction(action)) {
            return next(action)
        }
        const existingMeta = (action as { meta?: object }).meta
        const meta: AppConfigMeta = { ...existingMeta, appCachedData }
        return next({ ...action, meta })
    }

export const getAppCachedData = (
    action: { meta?: Partial<AppConfigMeta> } | UnknownAction
): AppCachedData | undefined =>
    (action as { meta?: Partial<AppConfigMeta> }).meta?.appCachedData
