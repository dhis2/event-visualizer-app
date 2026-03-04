import { act, renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useIsDelayedLoadingMore } from '../use-delayed-is-loading-more'

describe('useIsDelayedLoadingMore', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should initialize with loading state false', () => {
        const { result } = renderHook(() => useIsDelayedLoadingMore())

        expect(result.current.isDelayedLoadingMore).toBe(false)
    })

    it('should set loading to true after SHOW_DELAY (250ms)', async () => {
        const { result } = renderHook(() => useIsDelayedLoadingMore())

        act(() => {
            result.current.startDelayedLoadingMore()
        })

        expect(result.current.isDelayedLoadingMore).toBe(false)

        await act(() => vi.advanceTimersByTimeAsync(249))
        expect(result.current.isDelayedLoadingMore).toBe(false)

        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isDelayedLoadingMore).toBe(true)
    })

    it('should clear loading state immediately if completeDelayedLoadingMore is called before SHOW_DELAY', async () => {
        const { result } = renderHook(() => useIsDelayedLoadingMore())

        act(() => {
            result.current.startDelayedLoadingMore()
        })

        await act(() => vi.advanceTimersByTimeAsync(100))
        expect(result.current.isDelayedLoadingMore).toBe(false)

        await act(() => result.current.completeDelayedLoadingMore())
        expect(result.current.isDelayedLoadingMore).toBe(false)

        await act(() => vi.advanceTimersByTimeAsync(150))
        expect(result.current.isDelayedLoadingMore).toBe(false)
    })

    it('should clear loading state immediately if loading lasted MIN_LOAD_DURATION (400ms) or more', async () => {
        const { result } = renderHook(() => useIsDelayedLoadingMore())

        act(() => {
            result.current.startDelayedLoadingMore()
        })

        await act(() => vi.advanceTimersByTimeAsync(250))
        expect(result.current.isDelayedLoadingMore).toBe(true)

        await act(() => vi.advanceTimersByTimeAsync(400))
        expect(result.current.isDelayedLoadingMore).toBe(true)

        await act(() => result.current.completeDelayedLoadingMore())
        expect(result.current.isDelayedLoadingMore).toBe(false)
    })

    it('should wait for remaining time if loading lasted less than MIN_LOAD_DURATION', async () => {
        const { result } = renderHook(() => useIsDelayedLoadingMore())

        act(() => {
            result.current.startDelayedLoadingMore()
        })

        await act(() => vi.advanceTimersByTimeAsync(250))
        expect(result.current.isDelayedLoadingMore).toBe(true)

        await act(() => vi.advanceTimersByTimeAsync(200))
        expect(result.current.isDelayedLoadingMore).toBe(true)

        // Call completeDelayedLoadingMore - loading has lasted 200ms,
        // so it needs to wait 200ms more (400ms MIN_LOAD_DURATION - 200ms elapsed)
        result.current.completeDelayedLoadingMore()
        expect(result.current.isDelayedLoadingMore).toBe(true)

        // Advance 199ms - not enough time yet
        await act(() => vi.advanceTimersByTimeAsync(199))
        expect(result.current.isDelayedLoadingMore).toBe(true)

        // Advance 1ms more - timeout fires, loading should stop
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(result.current.isDelayedLoadingMore).toBe(false)
    })

    it('should clear timeouts on unmount', async () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
        const { result, unmount } = renderHook(() => useIsDelayedLoadingMore())

        act(() => {
            result.current.startDelayedLoadingMore()
        })

        await act(() => vi.advanceTimersByTimeAsync(100))
        unmount()

        expect(clearTimeoutSpy).toHaveBeenCalled()
        clearTimeoutSpy.mockRestore()
    })
})
