import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResizeHandle } from '../use-resize-handle'

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

const createNode = (scrollHeight: number) =>
    ({
        getBoundingClientRect: () => ({ top: 0, left: 0 }),
        scrollHeight,
        scrollWidth: 0,
    }) as unknown as HTMLDivElement

const STORAGE_KEY = 'test.axesHeight'

const renderResizeHandle = (
    overrides: { min?: number; max?: number; collapseThreshold?: number } = {}
) =>
    renderHook(() =>
        useResizeHandle({
            orientation: 'horizontal',
            storageKey: STORAGE_KEY,
            min: overrides.min ?? 56,
            collapseThreshold: overrides.collapseThreshold ?? 24,
            max: overrides.max ?? 300,
        })
    )

afterEach(() => {
    localStorage.clear()
})

describe('useResizeHandle', () => {
    it('lifts a stored size that is below the min up to the min', () => {
        localStorage.setItem(STORAGE_KEY, '30')

        const { result } = renderResizeHandle({ min: 116 })

        act(() => {
            result.current.containerRef(createNode(200))
        })

        expect(result.current.size).toBe(116)
    })

    it('caps the initial size at the container content height', () => {
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

    it('grows when dragging downwards within the available space', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({ min: 56, max: 300 })

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

    it('persists the size to local storage on pointer up', () => {
        const target = createTarget()
        const { result } = renderResizeHandle({ min: 56, max: 300 })

        act(() => {
            result.current.containerRef(createNode(200))
        })
        act(() => {
            result.current.eventHandlers.onPointerUp(
                createPointerEvent(200, target)
            )
        })

        expect(localStorage.getItem(STORAGE_KEY)).toBe('200')
    })
})
