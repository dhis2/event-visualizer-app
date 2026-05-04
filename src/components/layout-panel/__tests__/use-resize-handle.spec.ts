import { act, renderHook } from '@testing-library/react'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockInstance,
} from 'vitest'
import { useResizeHandle } from '../use-resize-handle'

type ResizeObserverMockInstance = {
    callback: ResizeObserverCallback
    observe: ReturnType<typeof vi.fn>
    unobserve: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
}

let resizeObserverInstances: ResizeObserverMockInstance[] = []

class MockResizeObserver implements ResizeObserverMockInstance {
    callback: ResizeObserverCallback
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn(() => {
        resizeObserverInstances = resizeObserverInstances.filter(
            (instance) => instance !== this
        )
    })

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback
        resizeObserverInstances.push(this)
    }
}

const fireResize = (height: number) => {
    const target = document.createElement('div')
    const entry = {
        contentRect: { height, width: 0 } as DOMRectReadOnly,
        target,
        contentBoxSize: [],
        borderBoxSize: [],
        devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry

    resizeObserverInstances.forEach((instance) => {
        instance.callback([entry], instance as unknown as ResizeObserver)
    })
}

const STORAGE_KEY = 'test.axes.height'
const MIN = 56

const createPointerEvent = ({
    clientY = 0,
    clientX = 0,
    captured = true,
    pointerId = 1,
}: {
    captured?: boolean
    clientX?: number
    clientY?: number
    pointerId?: number
} = {}) => {
    const currentTarget = {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
        hasPointerCapture: vi.fn(() => captured),
    }
    return {
        preventDefault: vi.fn(),
        pointerId,
        clientX,
        clientY,
        currentTarget,
    } as unknown as React.PointerEvent
}

const attachContainer = (
    result: { current: ReturnType<typeof useResizeHandle> },
    rect: Partial<DOMRect> = {}
) => {
    const node = document.createElement('div')
    const fullRect: DOMRect = {
        top: 100,
        left: 0,
        bottom: 200,
        right: 200,
        width: 200,
        height: 100,
        x: 0,
        y: 100,
        toJSON: () => ({}),
        ...rect,
    } as DOMRect
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue(fullRect)
    result.current.containerRef.current = node
    return node
}

const attachContent = (result: {
    current: ReturnType<typeof useResizeHandle>
}) => {
    const node = document.createElement('div')
    act(() => {
        result.current.contentRef(node)
    })
    return node
}

describe('useResizeHandle', () => {
    let originalResizeObserver: typeof globalThis.ResizeObserver

    beforeEach(() => {
        resizeObserverInstances = []
        originalResizeObserver = globalThis.ResizeObserver
        globalThis.ResizeObserver =
            MockResizeObserver as unknown as typeof globalThis.ResizeObserver
        localStorage.clear()
    })

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver
        localStorage.clear()
        vi.restoreAllMocks()
    })

    describe('initialization', () => {
        it('starts with size null when no stored value', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            expect(result.current.size).toBeNull()
            expect(result.current.isDragging).toBe(false)
            expect(result.current.minReached).toBe(false)
        })

        it('reads the initial size from localStorage when present', () => {
            localStorage.setItem(STORAGE_KEY, '180')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            expect(result.current.size).toBe(180)
        })

        it('treats malformed stored values as null', () => {
            localStorage.setItem(STORAGE_KEY, 'not-a-number')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            expect(result.current.size).toBeNull()
        })
    })

    describe('drag handling', () => {
        it('captures the rendered size when starting to drag from the default state', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 80 })
            attachContent(result)
            fireResize(300)

            const event = createPointerEvent({ clientY: 180 })
            act(() => {
                result.current.eventHandlers.onPointerDown(event)
            })

            expect(result.current.isDragging).toBe(true)
            expect(event.preventDefault).toHaveBeenCalled()
            expect(event.currentTarget.setPointerCapture).toHaveBeenCalledWith(
                1
            )
        })

        it('updates size based on pointer position during drag', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 80 })
            attachContent(result)
            fireResize(400)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 180 })
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerMove(
                    createPointerEvent({ clientY: 250 })
                )
            })

            expect(result.current.size).toBe(150)
        })

        it('clamps drag size to the natural content height (not 20vh)', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 100 })
            attachContent(result)
            fireResize(220)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 200 })
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerMove(
                    /* Mouse 600px from top of viewport — newSize would be
                     * 500px without clamping; the natural content cap (220)
                     * should win. */
                    createPointerEvent({ clientY: 600 })
                )
            })

            expect(result.current.size).toBe(220)
        })

        it('triggers minReached and ends the drag when shrinking below min', () => {
            localStorage.setItem(STORAGE_KEY, '120')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 120 })
            attachContent(result)
            fireResize(300)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 220 })
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerMove(
                    /* newSize = 130 - 100 = 30, below MIN (56) */
                    createPointerEvent({ clientY: 130 })
                )
            })

            expect(result.current.minReached).toBe(true)
            expect(result.current.isDragging).toBe(false)
            /* size should be restored to the pre-drag value, not the
             * sub-min drag position. */
            expect(result.current.size).toBe(120)
        })

        it('restores size to null when minReached is triggered from the default state', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 80 })
            attachContent(result)
            fireResize(300)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 180 })
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerMove(
                    createPointerEvent({ clientY: 110 })
                )
            })

            expect(result.current.minReached).toBe(true)
            expect(result.current.size).toBeNull()
        })

        it('ignores pointer move events that lack pointer capture', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 80 })
            attachContent(result)
            fireResize(300)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 180 })
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerMove(
                    createPointerEvent({ clientY: 250, captured: false })
                )
            })

            /* Without capture, the move callback returns early and the
             * size remains untouched (null in the default state). */
            expect(result.current.size).toBeNull()
        })

        it('persists the final size to localStorage on pointer up', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 80 })
            attachContent(result)
            fireResize(400)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 180 })
                )
            })
            act(() => {
                result.current.eventHandlers.onPointerMove(
                    createPointerEvent({ clientY: 300 })
                )
            })

            const upEvent = createPointerEvent({ clientY: 300 })
            act(() => {
                result.current.eventHandlers.onPointerUp(upEvent)
            })

            expect(result.current.isDragging).toBe(false)
            expect(localStorage.getItem(STORAGE_KEY)).toBe('200')
            expect(
                upEvent.currentTarget.releasePointerCapture
            ).toHaveBeenCalledWith(1)
        })

        it('does not write to localStorage when size is still null on pointer up', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { top: 100, height: 80 })
            attachContent(result)
            fireResize(300)

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientY: 180 })
                )
            })
            act(() => {
                result.current.eventHandlers.onPointerUp(
                    createPointerEvent({ clientY: 180 })
                )
            })

            expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
        })
    })

    describe('double-click reset', () => {
        it('clears stored value and resets size to null', () => {
            localStorage.setItem(STORAGE_KEY, '180')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            expect(result.current.size).toBe(180)

            act(() => {
                result.current.eventHandlers.onDoubleClick()
            })

            expect(result.current.size).toBeNull()
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
            expect(result.current.minReached).toBe(false)
        })
    })

    describe('content shrink clamping', () => {
        it('clamps user-set size when natural content shrinks below it', () => {
            localStorage.setItem(STORAGE_KEY, '300')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result)
            attachContent(result)

            act(() => {
                fireResize(150)
            })

            expect(result.current.size).toBe(150)
        })

        it('clamps to min when natural content drops below min', () => {
            localStorage.setItem(STORAGE_KEY, '300')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result)
            attachContent(result)

            act(() => {
                fireResize(20)
            })

            expect(result.current.size).toBe(MIN)
        })

        it('does not change size when content is larger than user-set size', () => {
            localStorage.setItem(STORAGE_KEY, '180')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result)
            attachContent(result)

            act(() => {
                fireResize(500)
            })

            expect(result.current.size).toBe(180)
        })

        it('does not engage clamping when size is null (default state)', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result)
            attachContent(result)

            act(() => {
                fireResize(20)
            })

            expect(result.current.size).toBeNull()
        })
    })

    describe('resetSize', () => {
        it('clears size and minReached without touching storage', () => {
            localStorage.setItem(STORAGE_KEY, '180')

            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            act(() => {
                result.current.resetSize()
            })

            expect(result.current.size).toBeNull()
            expect(localStorage.getItem(STORAGE_KEY)).toBe('180')
        })
    })

    describe('vertical orientation', () => {
        it('uses clientX and rect.left when orientation is vertical', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'vertical',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContainer(result, { left: 50, width: 100 })
            attachContent(result)
            // Send a width via the contentRect; ResizeObserver only exposes
            // contentRect.height in our mock so use that field generically.
            const target = document.createElement('div')
            const entry = {
                contentRect: { height: 0, width: 400 } as DOMRectReadOnly,
                target,
                contentBoxSize: [],
                borderBoxSize: [],
                devicePixelContentBoxSize: [],
            } as unknown as ResizeObserverEntry
            act(() => {
                resizeObserverInstances.forEach((instance) =>
                    instance.callback(
                        [entry],
                        instance as unknown as ResizeObserver
                    )
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerDown(
                    createPointerEvent({ clientX: 150, clientY: 0 })
                )
            })

            act(() => {
                result.current.eventHandlers.onPointerMove(
                    createPointerEvent({ clientX: 230, clientY: 0 })
                )
            })

            expect(result.current.size).toBe(180)
        })
    })

    describe('observer lifecycle', () => {
        it('disconnects the previous observer when the content node changes', () => {
            const { result } = renderHook(() =>
                useResizeHandle({
                    min: MIN,
                    orientation: 'horizontal',
                    storageKey: STORAGE_KEY,
                })
            )

            attachContent(result)
            expect(resizeObserverInstances).toHaveLength(1)
            const firstObserver = resizeObserverInstances[0]
            const disconnectSpy = firstObserver.disconnect as MockInstance

            act(() => {
                result.current.contentRef(null)
            })

            expect(disconnectSpy).toHaveBeenCalled()
        })
    })
})
