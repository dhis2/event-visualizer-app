import { uiSlice } from '@store/ui-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    LAYOUT_PANEL_HEIGHT_AUTO_FIT,
    type LayoutPanelHeight,
} from '../constants'
import { setLayoutPanelHeightToLocalStorage } from '../local-storage'
import { useResizeHandle } from '../use-resize-handle'

vi.mock('../local-storage', () => ({
    getLayoutPanelHeightFromLocalStorage: vi.fn(() => 'AUTO_FIT'),
    setLayoutPanelHeightToLocalStorage: vi.fn(),
}))

type FakeTarget = {
    setPointerCapture: ReturnType<typeof vi.fn>
    releasePointerCapture: ReturnType<typeof vi.fn>
    hasPointerCapture: () => boolean
}

const createTarget = (hasCapture = true): FakeTarget => ({
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: () => hasCapture,
})

const createPointerEvent = (clientY: number, target: FakeTarget) =>
    ({
        clientX: 0,
        clientY,
        pointerId: 1,
        currentTarget: target,
        preventDefault: vi.fn(),
    }) as unknown as React.PointerEvent

const createNode = (scrollHeight: number, clientHeight = scrollHeight) =>
    ({
        getBoundingClientRect: () => ({ top: 0, left: 0 }),
        scrollHeight,
        scrollWidth: 0,
        clientHeight,
        clientWidth: 0,
    }) as unknown as HTMLDivElement

/* The user-set height now lives in the Redux UI slice (`layoutPanelHeight`),
 * not localStorage; seed it via the store. */
const renderResizeHandle = (
    overrides: {
        min?: number
        max?: number
        collapseThreshold?: number
        contentKey?: string
        layoutPanelHeight?: LayoutPanelHeight
    } = {}
) => {
    const store = setupStore(
        { [uiSlice.name]: uiSlice.reducer },
        {
            [uiSlice.name]: {
                ...uiSlice.getInitialState(),
                layoutPanelHeight:
                    overrides.layoutPanelHeight ?? LAYOUT_PANEL_HEIGHT_AUTO_FIT,
            },
        }
    )

    const contentKeyRef = { current: overrides.contentKey ?? 'a' }

    const utils = renderHookWithReduxStoreProvider(
        () =>
            useResizeHandle({
                orientation: 'horizontal',
                min: overrides.min ?? 56,
                collapseThreshold: overrides.collapseThreshold ?? 24,
                contentKey: contentKeyRef.current,
                max: overrides.max ?? 300,
            }),
        store
    )

    const setContentKey = (contentKey: string) => {
        contentKeyRef.current = contentKey
        utils.rerender()
    }

    return { ...utils, setContentKey }
}

afterEach(() => {
    vi.clearAllMocks()
})

describe('useResizeHandle', () => {
    it('lifts a stored size that is below the min up to the min', () => {
        const { result } = renderResizeHandle({
            min: 116,
            layoutPanelHeight: 30,
        })

        act(() => {
            result.current.containerRef(createNode(200))
        })

        expect(result.current.size).toBe(116)
    })

    it('sets the initial size to the content height', () => {
        const { result } = renderResizeHandle({ min: 56, max: 300 })

        act(() => {
            result.current.containerRef(createNode(120))
        })

        expect(result.current.size).toBe(120)
    })

    it('does not collapse when dragging downwards from the min', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({ min: 56, max: 300 })

        act(() => {
            result.current.containerRef(createNode(56))
        })

        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(56, target)
            )
        })
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(86, target)
            )
        })

        expect(result.current.minReached).toBe(false)
    })

    it('follows the cursor displacement while dragging', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({ min: 56, max: 300 })

        // Initial size is the content height (200).
        act(() => {
            result.current.containerRef(createNode(200))
        })
        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(100, target)
            )
        })
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(60, target)
            )
        })

        // 200 - 40 (moved up 40px) = 160.
        expect(result.current.minReached).toBe(false)
        expect(result.current.size).toBe(160)
    })

    it('shrinks below the min without collapsing while above the collapse threshold', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({
            min: 116,
            collapseThreshold: 24,
            max: 300,
        })

        // Initial size is the content height (116).
        act(() => {
            result.current.containerRef(createNode(116))
        })
        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(116, target)
            )
        })
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(80, target)
            )
        })

        // Dragged to 80, below the min (116) but above the collapse threshold.
        expect(result.current.minReached).toBe(false)
        expect(result.current.size).toBe(80)
    })

    it('collapses only when dragging past the collapse threshold', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({
            min: 116,
            collapseThreshold: 24,
            max: 300,
        })

        // Initial size is the content height (116).
        act(() => {
            result.current.containerRef(createNode(116))
        })
        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(116, target)
            )
        })
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(10, target)
            )
        })

        expect(result.current.minReached).toBe(true)
    })

    it('can be dragged past the content height, up to the max', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({ min: 58, max: 300 })

        // Mounts short (few chips); the content height is 120.
        act(() => {
            result.current.containerRef(createNode(120))
        })
        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(120, target)
            )
        })
        // Drag well past the content height: the panel keeps growing instead of
        // stopping at the content, capped only by the max.
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(400, target)
            )
        })

        expect(result.current.size).toBe(300)
    })

    it('honors a user-set height taller than the content height', () => {
        const { result } = renderResizeHandle({
            min: 58,
            max: 300,
            layoutPanelHeight: 250,
        })

        // Content only needs 100, but the user-set height is their choice and is
        // not shrunk back down to the content height.
        act(() => {
            result.current.containerRef(createNode(100))
        })

        expect(result.current.size).toBe(250)
    })

    it('never drags taller than the max even with a large content', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({ min: 58, max: 160 })

        act(() => {
            result.current.containerRef(createNode(400))
        })
        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(100, target)
            )
        })
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(400, target)
            )
        })

        expect(result.current.size).toBe(160)
    })

    it('tracks from the rendered height when dragging after a double-click reset', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({
            min: 58,
            collapseThreshold: 24,
            max: 300,
        })

        // Content is taller than the min (e.g. chips wrapped to two rows).
        act(() => {
            result.current.containerRef(createNode(90))
        })
        // The double-click reset drops the explicit size; the panel renders at
        // its content height (90), not the min.
        act(() => {
            result.current.resetSize()
        })

        // Grab at the bottom edge and move up 30px.
        act(() => {
            result.current.eventHandlers.onPointerDown(
                createPointerEvent(90, target)
            )
        })
        act(() => {
            result.current.eventHandlers.onPointerMove(
                createPointerEvent(60, target)
            )
        })

        // Connected to the cursor from the rendered height (90 - 30 = 60),
        // not jumping to the min (which would give 58 - 30 = 28).
        expect(result.current.minReached).toBe(false)
        expect(result.current.size).toBe(60)
    })

    it('resetToContentHeight publishes AUTO_FIT and refits to content', () => {
        const { result, store } = renderResizeHandle({
            min: 58,
            max: 300,
            layoutPanelHeight: 250,
        })

        act(() => {
            result.current.containerRef(createNode(120))
        })
        // Honors the user-set height initially.
        expect(result.current.size).toBe(250)

        act(() => {
            result.current.resetToContentHeight()
        })

        // The user-set height is cleared (AUTO_FIT in the store and localStorage)
        // and the panel refits to the live content. This is also the double-click
        // handle behavior.
        expect(store.getState().ui.layoutPanelHeight).toBe(
            LAYOUT_PANEL_HEIGHT_AUTO_FIT
        )
        expect(setLayoutPanelHeightToLocalStorage).toHaveBeenCalledWith(
            LAYOUT_PANEL_HEIGHT_AUTO_FIT
        )
        expect(result.current.size).toBe(120)
    })

    it('refits when AUTO_FIT is published from elsewhere (View menu)', () => {
        const { result, store } = renderResizeHandle({
            min: 58,
            max: 300,
            layoutPanelHeight: 250,
        })

        act(() => {
            result.current.containerRef(createNode(120))
        })
        expect(result.current.size).toBe(250)

        // The View menu dispatches AUTO_FIT directly (not via the hook).
        act(() => {
            store.dispatch(uiSlice.actions.setUiLayoutPanelHeight('AUTO_FIT'))
        })

        expect(result.current.size).toBe(120)
    })

    it('re-fits to the new content when the layout changes', () => {
        const { result, setContentKey } = renderResizeHandle({
            min: 56,
            max: 300,
            contentKey: 'a',
        })

        const node = createNode(100)
        act(() => {
            result.current.containerRef(node)
        })
        expect(result.current.size).toBe(100)

        // A chip is added: the live content grows to 200.
        ;(node as unknown as { scrollHeight: number }).scrollHeight = 200
        act(() => {
            setContentKey('b')
        })

        expect(result.current.size).toBe(200)
    })

    it('re-fits smaller when the layout shrinks', () => {
        const { result, setContentKey } = renderResizeHandle({
            min: 56,
            max: 300,
            contentKey: 'a',
        })

        const node = createNode(200)
        act(() => {
            result.current.containerRef(node)
        })
        expect(result.current.size).toBe(200)

        // Chips are removed: the live content shrinks to 90. The re-fit measures
        // the auto content, so the stale larger size does not skew it.
        ;(node as unknown as { scrollHeight: number }).scrollHeight = 90
        act(() => {
            setContentKey('b')
        })

        expect(result.current.size).toBe(90)
    })

    it('does not re-fit when the layout changes if the user has set a height', () => {
        const { result, setContentKey } = renderResizeHandle({
            min: 56,
            max: 300,
            contentKey: 'a',
            layoutPanelHeight: 250,
        })

        const node = createNode(100)
        act(() => {
            result.current.containerRef(node)
        })
        // Honors the user-set height, not the content height.
        expect(result.current.size).toBe(250)

        // A chip is added: the live content grows, but the user-set height holds
        // and the content scrolls within it.
        ;(node as unknown as { scrollHeight: number }).scrollHeight = 200
        act(() => {
            setContentKey('b')
        })

        expect(result.current.size).toBe(250)
    })

    it('persists the size to the store and localStorage on pointer up', () => {
        const target = createTarget()
        const { result, store } = renderResizeHandle({ min: 56, max: 300 })

        // Initial size is the content height (200).
        act(() => {
            result.current.containerRef(createNode(200))
        })
        act(() => {
            result.current.eventHandlers.onPointerUp(
                createPointerEvent(200, target)
            )
        })

        expect(store.getState().ui.layoutPanelHeight).toBe(200)
        expect(setLayoutPanelHeightToLocalStorage).toHaveBeenCalledWith(200)
    })
})
