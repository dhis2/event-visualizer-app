/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClientRect, type DndMonitorListener } from '@dnd-kit/core'
import type { useSortable } from '@dnd-kit/sortable'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DropInsertMarker } from '../drop-insert-marker'
import classes from '../styles/insert-marker.module.css'

let mockOnDragMove: DndMonitorListener['onDragMove'] | undefined

vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core')
    return {
        ...actual,
        useDndMonitor: vi.fn((listeners: DndMonitorListener) => {
            mockOnDragMove = listeners.onDragMove
        }),
    }
})

const createMockRect = ({
    left,
    width,
    top = 0,
    height = 20,
}: {
    left: number
    width: number
    top?: number
    height?: number
}): ClientRect => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
})

describe('DropInsertMarker', () => {
    beforeEach(() => {
        mockOnDragMove = undefined
    })

    // Helper to access the onDragMove callback
    it('should not render when active is null', () => {
        const mockSortable: ReturnType<typeof useSortable> = {
            active: null,
            activeIndex: undefined,
            index: 0,
            rect: { current: createMockRect({ left: 0, width: 100 }) },
        } as any

        const { queryByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        expect(queryByTestId('drop-insert-marker')).not.toBeInTheDocument()
    })

    it('should render marker at start when dragged from different axis (before center)', () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const draggedRect = createMockRect({ left: 50, width: 100 }) // center at 100

        const mockSortable: ReturnType<typeof useSortable> = {
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'filters', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: draggedRect,
                        initial: null,
                    },
                },
            },
            activeIndex: 0,
            index: 1,
            rect: { current: chipRect },
        } as any

        const { getByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        const marker = getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
        expect(marker).not.toHaveClass(classes.atEnd)
    })

    it('should update marker position from left to right on drag move', async () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const initialDraggedRect = createMockRect({ left: 50, width: 100 }) // center at 100 (before chip center)

        const mockSortable: ReturnType<typeof useSortable> = {
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'filters', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: initialDraggedRect,
                        initial: null,
                    },
                },
            },
            activeIndex: 0,
            index: 1,
            rect: { current: chipRect },
        } as any

        const { getByTestId, queryByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // Initially marker should be at start (left)
        let marker = getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
        expect(marker).not.toHaveClass(classes.atEnd)

        // Simulate drag move to the right side of chip
        const newDraggedRect = createMockRect({ left: 150, width: 100 }) // center at 200 (after chip center)
        expect(mockOnDragMove).toBeDefined()

        mockOnDragMove!({
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'filters', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: newDraggedRect,
                        initial: null,
                    },
                },
            },
            over: null,
            delta: { x: 100, y: 0 },
            collisions: null,
        } as any)

        // Wait for state update and marker should now be at end (right)
        await waitFor(() => {
            marker = queryByTestId('drop-insert-marker')!
            expect(marker).toBeInTheDocument()
            expect(marker).toHaveClass(classes.atEnd)
        })
    })

    it('should render marker at end when dragged from different axis (after center)', () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const draggedRect = createMockRect({ left: 150, width: 100 }) // center at 200

        const setInsertAfter = vi.fn()
        const mockSortable: ReturnType<typeof useSortable> = {
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'filters', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: draggedRect,
                        initial: null,
                    },
                },
            },
            activeIndex: 0,
            index: 1,
            rect: { current: chipRect },
        } as any

        const { getByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={setInsertAfter}
                axisId="columns"
            />
        )

        const marker = getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
        expect(marker).toHaveClass(classes.atEnd)
        expect(setInsertAfter).toHaveBeenCalledWith(true)
    })

    it('should not render when hovering adjacent chip before active (no-op)', () => {
        const chipRect = createMockRect({ left: 100, width: 100 })
        const draggedRect = createMockRect({ left: 150, width: 100 }) // AFTER chip center

        const mockSortable: ReturnType<typeof useSortable> = {
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'columns', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: draggedRect,
                        initial: null,
                    },
                },
            },
            activeIndex: 1,
            index: 0, // chip before active
            rect: { current: chipRect },
        } as any

        const { queryByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // Dropping AFTER index 0 would put it at index 1 (where it already is) = no-op
        expect(queryByTestId('drop-insert-marker')).not.toBeInTheDocument()
    })

    it('should not render when hovering adjacent chip after active (no-op)', () => {
        const chipRect = createMockRect({ left: 100, width: 100 })
        const draggedRect = createMockRect({ left: 50, width: 100 }) // BEFORE chip center

        const mockSortable: ReturnType<typeof useSortable> = {
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'columns', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: draggedRect,
                        initial: null,
                    },
                },
            },
            activeIndex: 0,
            index: 1, // chip after active
            rect: { current: chipRect },
        } as any

        const { queryByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // Dropping BEFORE index 1 would put it at index 0 (where it already is) = no-op
        expect(queryByTestId('drop-insert-marker')).not.toBeInTheDocument()
    })

    it('should render when hovering non-adjacent chip on same axis', () => {
        const chipRect = createMockRect({ left: 100, width: 100 })
        const draggedRect = createMockRect({ left: 50, width: 100 })

        const mockSortable: ReturnType<typeof useSortable> = {
            active: {
                id: 'dragged-id',
                data: { current: { axis: 'columns', dimensionId: 'test' } },
                rect: {
                    current: {
                        translated: draggedRect,
                        initial: null,
                    },
                },
            },
            activeIndex: 0,
            index: 2,
            rect: { current: chipRect },
        } as any

        const { getByTestId } = render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        const marker = getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
    })
})
