import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LayoutDragEndEvent } from '../types'
import { useOnDragEnd } from '../use-on-drag-end'
import { useAppDispatch, useAddMetadata } from '@hooks'
import {
    addVisUiConfigLayoutDimension,
    moveVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'

// Mock the hooks
vi.mock('@hooks', () => ({
    useAppDispatch: vi.fn(),
    useAddMetadata: vi.fn(),
}))

vi.mock('@store/vis-ui-config-slice', () => ({
    addVisUiConfigLayoutDimension: vi.fn(),
    moveVisUiConfigLayoutDimension: vi.fn(),
}))

describe('useOnDragEnd', () => {
    const mockDispatch = vi.fn()
    const mockAddMetadata = vi.fn()

    beforeEach(() => {
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)
        vi.mocked(useAddMetadata).mockReturnValue(mockAddMetadata)
        mockDispatch.mockClear()
        mockAddMetadata.mockClear()
    })

    it('should do nothing if event.active.data.current is missing', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const onDragEnd = result.current

        const event = {
            active: { data: { current: null } },
            over: null,
        } as unknown as LayoutDragEndEvent

        onDragEnd(event)

        expect(mockDispatch).not.toHaveBeenCalled()
        expect(mockAddMetadata).not.toHaveBeenCalled()
    })

    it('should do nothing if event.over is missing', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const onDragEnd = result.current

        const event = {
            active: { data: { current: { dimensionId: 'test' } } },
            over: null,
        } as unknown as LayoutDragEndEvent

        onDragEnd(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should do nothing if event.over.data.current.axis is missing', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const onDragEnd = result.current

        const event = {
            active: { data: { current: { dimensionId: 'test' } } },
            over: { data: { current: {} } },
        } as unknown as LayoutDragEndEvent

        onDragEnd(event)

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch addVisUiConfigLayoutDimension for sidebar drag to empty axis', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const onDragEnd = result.current

        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        // no axis, so from sidebar
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        isEmptyAxis: true,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        onDragEnd(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: 'test',
                insertIndex: 0,
            })
        )
    })

    it('should dispatch moveVisUiConfigLayoutDimension for axis to axis move', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const onDragEnd = result.current

        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        axis: 'rows',
                        sortable: { index: 1 },
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 2 },
                        insertAfter: true,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        onDragEnd(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            moveVisUiConfigLayoutDimension({
                dimensionId: 'test',
                sourceAxis: 'rows',
                targetAxis: 'columns',
                insertIndex: 2,
            })
        )
    })

    it('should calculate insertIndex correctly for insert before', () => {
        const { result } = renderHook(() => useOnDragEnd())
        const onDragEnd = result.current

        const event = {
            active: {
                data: {
                    current: {
                        dimensionId: 'test',
                        axis: 'rows',
                        sortable: { index: 1 },
                    },
                },
            },
            over: {
                data: {
                    current: {
                        axis: 'columns',
                        sortable: { index: 3 },
                        insertAfter: false,
                    },
                },
            },
        } as unknown as LayoutDragEndEvent

        onDragEnd(event)

        expect(mockDispatch).toHaveBeenCalledWith(
            moveVisUiConfigLayoutDimension({
                dimensionId: 'test',
                sourceAxis: 'rows',
                targetAxis: 'columns',
                insertIndex: 2, // 3 - 1
            })
        )
    })
})
