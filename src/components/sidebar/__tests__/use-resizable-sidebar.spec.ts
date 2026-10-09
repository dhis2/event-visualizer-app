import { uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from '../constants'
import { useResizableSidebar } from '../use-resizable-sidebar'

const createStore = (sidebarWidth = SIDEBAR_DEFAULT_WIDTH) =>
    setupStore(
        { [uiSlice.name]: uiSlice.reducer },
        { [uiSlice.name]: { ...uiSlice.getInitialState(), sidebarWidth } }
    )

const renderResizableHook = (sidebarWidth = SIDEBAR_DEFAULT_WIDTH) => {
    const store = createStore(sidebarWidth)
    return {
        ...renderHookWithReduxStoreProvider(() => useResizableSidebar(), store),
        store,
    }
}

describe('useResizableSidebar', () => {
    beforeEach(() => {
        vi.useFakeTimers()
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
            expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH)
        })

        it('initializes from the store width', () => {
            const { result } = renderResizableHook(500)
            expect(result.current.width).toBe(500)
        })

        it('starts with isDragging false', () => {
            const { result } = renderResizableHook()
            expect(result.current.isDragging).toBe(false)
        })
    })

    describe('dragging', () => {
        const createPointer = () => {
            let isCaptured = false
            const currentTarget = {
                setPointerCapture: () => {
                    isCaptured = true
                },
                hasPointerCapture: () => isCaptured,
                releasePointerCapture: () => {
                    isCaptured = false
                },
            }
            return (clientX: number) =>
                ({
                    clientX,
                    pointerId: 1,
                    preventDefault: vi.fn(),
                    currentTarget,
                }) as unknown as React.PointerEvent
        }

        const drag = (
            result: ReturnType<typeof renderResizableHook>['result'],
            fromX: number,
            toX: number
        ) => {
            const pointerAt = createPointer()
            act(() => {
                result.current.eventHandlers.onPointerDown(pointerAt(fromX))
            })
            if (toX !== fromX) {
                act(() => {
                    result.current.eventHandlers.onPointerMove(pointerAt(toX))
                })
            }
            return pointerAt(toX)
        }

        const release = (
            result: ReturnType<typeof renderResizableHook>['result'],
            event: React.PointerEvent
        ) => {
            act(() => {
                result.current.eventHandlers.onPointerUp(event)
            })
        }

        it('saves the dragged width on pointer up, not while dragging', () => {
            const { result, store } = renderResizableHook()

            const pointerUp = drag(result, 400, 500)

            expect(result.current.width).toBe(500)
            expect(result.current.isDragging).toBe(true)
            expect(store.getState().ui.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH)

            release(result, pointerUp)

            expect(result.current.isDragging).toBe(false)
            expect(result.current.width).toBe(500)
            expect(store.getState().ui.sidebarWidth).toBe(500)
        })

        it('saves the width where the pointer is released', () => {
            const { result, store } = renderResizableHook()

            const pointerUp = drag(result, 400, 500)
            release(result, { ...pointerUp, clientX: 520 })

            expect(store.getState().ui.sidebarWidth).toBe(520)
        })

        it('keeps the stored width when the handle is clicked in a narrow window', () => {
            Object.defineProperty(globalThis, 'innerWidth', { value: 1000 })
            const { result, store } = renderResizableHook(800)

            release(result, drag(result, 420, 420))

            expect(result.current.width).toBe(420)
            expect(store.getState().ui.sidebarWidth).toBe(800)
        })

        it('keeps the stored width when a drag in a narrow window cannot grow the sidebar', () => {
            Object.defineProperty(globalThis, 'innerWidth', { value: 1000 })
            const { result, store } = renderResizableHook(800)

            release(result, drag(result, 420, 900))

            expect(result.current.width).toBe(420)
            expect(store.getState().ui.sidebarWidth).toBe(800)
        })

        it('saves a narrower width dragged in a narrow window', () => {
            Object.defineProperty(globalThis, 'innerWidth', { value: 1000 })
            const { result, store } = renderResizableHook(800)

            release(result, drag(result, 420, 300))

            expect(store.getState().ui.sidebarWidth).toBe(300)
        })

        it('ends the drag without saving on a pointer up without capture', () => {
            const { result, store } = renderResizableHook()

            drag(result, 400, 500)
            release(result, createPointer()(500))

            expect(result.current.isDragging).toBe(false)
            expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH)
            expect(store.getState().ui.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH)
        })

        it('ends the drag without saving when pointer capture is lost', () => {
            const { result, store } = renderResizableHook()

            drag(result, 400, 500)
            act(() => {
                result.current.eventHandlers.onLostPointerCapture()
            })

            expect(result.current.isDragging).toBe(false)
            expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH)
            expect(store.getState().ui.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH)
        })
    })

    describe('double-click reset', () => {
        it('resets and saves the default width on double-click', () => {
            const { result, store } = renderResizableHook(600)

            expect(result.current.width).toBe(600)

            act(() => {
                result.current.eventHandlers.onDoubleClick()
            })

            expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH)
            expect(store.getState().ui.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH)
        })

        it('clamps to min width if default exceeds max', () => {
            // Tiny viewport where max = 500 - 580 = -80, clamped to min
            Object.defineProperty(globalThis, 'innerWidth', { value: 500 })

            const { result } = renderResizableHook(600)

            act(() => {
                result.current.eventHandlers.onDoubleClick()
            })

            expect(result.current.width).toBe(SIDEBAR_MIN_WIDTH)
        })
    })

    describe('store-driven reset (View menu)', () => {
        it('resets local width when store is set to default', () => {
            const { result, store } = renderResizableHook(600)

            expect(result.current.width).toBe(600)

            act(() => {
                store.dispatch(uiSlice.actions.resetUiSidebarWidth())
            })

            expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH)
        })
    })

    describe('window resize re-clamping', () => {
        it('clamps width when viewport shrinks', async () => {
            const { result } = renderResizableHook(800)

            expect(result.current.width).toBe(800)

            // Shrink viewport: max = 700 - 580 = 120, but min is 200
            Object.defineProperty(globalThis, 'innerWidth', { value: 700 })
            act(() => {
                globalThis.dispatchEvent(new Event('resize'))
            })
            await act(() => vi.advanceTimersByTimeAsync(150))

            expect(result.current.width).toBe(SIDEBAR_MIN_WIDTH)
        })

        it('keeps the picked width as the preference when viewport shrinks', async () => {
            const { store } = renderResizableHook(800)

            Object.defineProperty(globalThis, 'innerWidth', { value: 700 })
            act(() => {
                globalThis.dispatchEvent(new Event('resize'))
            })
            await act(() => vi.advanceTimersByTimeAsync(150))

            expect(store.getState().ui.sidebarWidth).toBe(800)
        })

        it('grows back to the picked width when viewport widens again', async () => {
            const { result } = renderResizableHook(800)

            Object.defineProperty(globalThis, 'innerWidth', { value: 1000 })
            act(() => {
                globalThis.dispatchEvent(new Event('resize'))
            })
            await act(() => vi.advanceTimersByTimeAsync(150))

            expect(result.current.width).toBe(420)

            Object.defineProperty(globalThis, 'innerWidth', { value: 1920 })
            act(() => {
                globalThis.dispatchEvent(new Event('resize'))
            })
            await act(() => vi.advanceTimersByTimeAsync(150))

            expect(result.current.width).toBe(800)
        })

        it('starts clamped without overwriting a stored width that exceeds the viewport', () => {
            Object.defineProperty(globalThis, 'innerWidth', { value: 1000 })
            const { result, store } = renderResizableHook(800)

            expect(result.current.width).toBe(420)
            expect(store.getState().ui.sidebarWidth).toBe(800)
        })

        it('does not change width when viewport is large enough', async () => {
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
