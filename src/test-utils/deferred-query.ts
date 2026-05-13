import { waitFor } from '@testing-library/react'

/* Query/type are loosely typed because the upstream `queryData` mock surface
 * (via CustomDataProvider in @dhis2/app-runtime) is not strongly typed either,
 * and the existing mocks in the codebase rely on implicit-any access on
 * `query.params.*` and `query.id`. Forcing `unknown` here would push casts
 * into every test for no real safety win. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryHandler<T> = (type: any, query: any) => T | Promise<T>

/**
 * Wraps `queryData` handlers used by `renderWithAppWrapper` so the test can
 * decide when each mocked request resolves. `defer(handler)` returns a handler
 * whose returned Promise only settles once `releaseAll()` is called; until then
 * the request stays in flight and the app stays in its loading state.
 *
 * The reason this exists: a plain `setTimeout(N)`-based mock leaves the
 * spinner-visible window racing against `userEvent.click` + scheduler jitter,
 * which on slow CI can elapse the window before the test's first DOM poll. A
 * deferred resolution removes the timing race entirely — the response arrives
 * when the test says so, the way a real server's response does after a real
 * (variable) latency.
 */
export const createDeferredQuery = () => {
    let pending: Array<() => void> = []

    const enqueue = <T>(
        handler: QueryHandler<T>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query: any
    ) =>
        new Promise<T>((resolve, reject) => {
            pending.push(() => {
                try {
                    Promise.resolve(handler(type, query)).then(resolve, reject)
                } catch (err) {
                    reject(err)
                }
            })
        })

    const defer =
        <T>(handler: QueryHandler<T>): QueryHandler<T> =>
        (type, query) =>
            enqueue(handler, type, query)

    const releaseAll = async () => {
        await waitFor(() => {
            if (pending.length === 0) {
                throw new Error(
                    'createDeferredQuery: no pending requests to release'
                )
            }
        })
        const toRelease = pending
        pending = []
        toRelease.forEach((fn) => fn())
    }

    const reset = () => {
        pending = []
    }

    const pendingCount = () => pending.length

    return { defer, releaseAll, reset, pendingCount }
}
