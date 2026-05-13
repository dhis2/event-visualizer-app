import { createDeferredQuery } from '@test-utils/deferred-query'
import { describe, it, expect } from 'vitest'

describe('createDeferredQuery', () => {
    it('keeps wrapped requests pending until releaseAll is called', async () => {
        const { defer, releaseAll, pendingCount } = createDeferredQuery()
        const handler = defer(() => 'response')

        let resolved: string | undefined
        const requestPromise = (handler('any', {}) as Promise<string>).then(
            (value) => {
                resolved = value
            }
        )

        // Microtask flush — handler is pending, has not resolved
        await Promise.resolve()
        expect(resolved).toBeUndefined()
        expect(pendingCount()).toBe(1)

        await releaseAll()
        await requestPromise

        expect(resolved).toBe('response')
        expect(pendingCount()).toBe(0)
    })

    it('releases all in-flight handlers in a single releaseAll call', async () => {
        const { defer, releaseAll, pendingCount } = createDeferredQuery()
        const handler = defer((_, query: { id: string }) => query.id)

        const first = handler('any', { id: 'a' }) as Promise<string>
        const second = handler('any', { id: 'b' }) as Promise<string>

        expect(pendingCount()).toBe(2)

        await releaseAll()

        expect(await first).toBe('a')
        expect(await second).toBe('b')
        expect(pendingCount()).toBe(0)
    })

    it('passes errors thrown in the handler through to the caller', async () => {
        const { defer, releaseAll } = createDeferredQuery()
        const handler = defer(() => {
            throw new Error('boom')
        })

        const requestPromise = handler('any', {}) as Promise<unknown>
        await releaseAll()

        await expect(requestPromise).rejects.toThrow('boom')
    })

    it('reset clears pending requests without resolving them', () => {
        const { defer, reset, pendingCount } = createDeferredQuery()
        const handler = defer(() => 'response')

        handler('any', {})
        handler('any', {})
        expect(pendingCount()).toBe(2)

        reset()

        expect(pendingCount()).toBe(0)
    })
})
