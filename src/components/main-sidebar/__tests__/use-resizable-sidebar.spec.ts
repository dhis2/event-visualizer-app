import { uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    MAIN_SIDEBAR_DEFAULT_WIDTH,
    MAIN_SIDEBAR_MIN_WIDTH,
} from '../constants'
import {
    getMainSidebarWidthFromLocalStorage,
    setMainSidebarWidthToLocalStorage,
} from '../local-storage'
import { useResizableSidebar } from '../use-resizable-sidebar'

vi.mock('../local-storage', () => ({
    getMainSidebarWidthFromLocalStorage: vi.fn(() => 400),
    setMainSidebarWidthToLocalStorage: vi.fn(),
}))

const createStore = (mainSidebarWidth = MAIN_SIDEBAR_DEFAULT_WIDTH) =>
    setupStore(
        { [uiSlice.name]: uiSlice.reducer },
        { [uiSlice.name]: { ...uiSlice.getInitialState(), mainSidebarWidth } }
    )

const renderResizableHook = (mainSidebarWidth = MAIN_SIDEBAR_DEFAULT_WIDTH) => {
    const store = createStore(mainSidebarWidth)
    return {
        ...renderHookWithReduxStoreProvider(() => useResizableSidebar(), store),
        store,
    }
}

describe('useResizableSidebar', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(
            MAIN_SIDEBAR_DEFAULT_WIDTH
        )
        // Default viewport: 1440px wide
        Object.defineProperty(globalThis, 'innerWidth', {
            value: 1440,
            writable: true,
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    describe('initialization', () => {
        it('initializes with default width when no stored value', () => {
            const { result } = renderResizableHook()
            expect(result.current.width).toBe(MAIN_SIDEBAR_DEFAULT_WIDTH)
        })

        it('initializes from localStorage when a value is stored', () => {
            vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(500)
            const { result } = renderResizableHook(500)
            expect(result.current.width).toBe(500)
        })

        it('starts with isDragging false', () => {
            const { result } = renderResizableHook()
            expect(result.current.isDragging).toBe(false)
        })

        it('returns a containerRef', () => {
            const { result } = renderResizableHook()
            expect(result.current.containerRef).toBeDefined()
            expect(result.current.containerRef.current).toBeNull()
        })
    })

    describe('syncing to store and localStorage', () => {
        it('syncs width to Redux store after debounce', async () => {
            const { store } = renderResizableHook()

            await act(() => vi.advanceTimersByTimeAsync(600))

            expect(store.getState().ui.mainSidebarWidth).toBe(
                MAIN_SIDEBAR_DEFAULT_WIDTH
            )
        })

        it('persists width to localStorage after debounce', async () => {
            renderResizableHook()

            await act(() => vi.advanceTimersByTimeAsync(600))

            expect(setMainSidebarWidthToLocalStorage).toHaveBeenCalledWith(
                MAIN_SIDEBAR_DEFAULT_WIDTH
            )
        })
    })

    describe('double-click reset', () => {
        it('resets width to default on double-click', async () => {
            vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(600)
            const { result } = renderResizableHook(600)

            expect(result.current.width).toBe(600)

            act(() => {
                result.current.eventHandlers.onDoubleClick()
            })

            expect(result.current.width).toBe(MAIN_SIDEBAR_DEFAULT_WIDTH)
        })

        it('clamps to min width if default exceeds max', () => {
            vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(600)
            // Tiny viewport where max = 500 - 580 = -80, clamped to min
            Object.defineProperty(globalThis, 'innerWidth', { value: 500 })

            const { result } = renderResizableHook(600)

            act(() => {
                result.current.eventHandlers.onDoubleClick()
            })

            expect(result.current.width).toBe(MAIN_SIDEBAR_MIN_WIDTH)
        })
    })

    describe('store-driven reset (View menu)', () => {
        it('resets local width when store is set to default', () => {
            vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(600)
            const { result, store } = renderResizableHook(600)

            expect(result.current.width).toBe(600)

            act(() => {
                store.dispatch(uiSlice.actions.resetUiMainSidebarWidth())
            })

            expect(result.current.width).toBe(MAIN_SIDEBAR_DEFAULT_WIDTH)
        })
    })

    describe('window resize re-clamping', () => {
        it('clamps width when viewport shrinks', async () => {
            vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(800)
            const { result } = renderResizableHook(800)

            expect(result.current.width).toBe(800)

            // Shrink viewport: max = 700 - 580 = 120, but min is 200
            Object.defineProperty(globalThis, 'innerWidth', { value: 700 })
            act(() => {
                globalThis.dispatchEvent(new Event('resize'))
            })
            await act(() => vi.advanceTimersByTimeAsync(150))

            expect(result.current.width).toBe(MAIN_SIDEBAR_MIN_WIDTH)
        })

        it('does not change width when viewport is large enough', async () => {
            vi.mocked(getMainSidebarWidthFromLocalStorage).mockReturnValue(500)
            const { result } = renderResizableHook(500)

            Object.defineProperty(globalThis, 'innerWidth', { value: 1920 })
            act(() => {
                globalThis.dispatchEvent(new Event('resize'))
            })
            await act(() => vi.advanceTimersByTimeAsync(150))

            expect(result.current.width).toBe(500)
        })
    })
})
