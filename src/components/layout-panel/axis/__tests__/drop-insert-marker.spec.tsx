/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClientRect, type DndMonitorListener } from '@dnd-kit/core'
import type { useSortable } from '@dnd-kit/sortable'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DropInsertMarker } from '../drop-insert-marker'
import classes from '../styles/drop-insert-marker.module.css'

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

const fireDragMove = ({
    active,
    clientX,
    deltaX,
}: {
    active: { id: string; data: { current: object } }
    clientX: number
    deltaX: number
}) => {
    act(() => {
        mockOnDragMove!({
            active: active as any,
            activatorEvent: { clientX } as any,
            over: null,
            delta: { x: deltaX, y: 0 },
            collisions: null,
        } as any)
    })
}

describe('DropInsertMarker', () => {
    beforeEach(() => {
        mockOnDragMove = undefined
    })

    it('should not render when active is null', () => {
        const mockSortable: ReturnType<typeof useSortable> = {
            active: null,
            activeIndex: undefined,
            index: 0,
            rect: { current: createMockRect({ left: 0, width: 100 }) },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        expect(
            screen.queryByTestId('drop-insert-marker')
        ).not.toBeInTheDocument()
    })

    it('should render marker at start when dragged from different axis (before center)', () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const active = {
            id: 'dragged-id',
            data: { current: { axis: 'filters', dimensionId: 'test' } },
        }

        const mockSortable: ReturnType<typeof useSortable> = {
            active,
            activeIndex: 0,
            index: 1,
            rect: { current: chipRect },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // pointerX = 120 + 0 = 120, before chip center at 150
        fireDragMove({ active, clientX: 120, deltaX: 0 })

        const marker = screen.getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
        expect(marker).not.toHaveClass(classes.atEnd)
    })

    it('should update marker position from left to right on drag move', async () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const active = {
            id: 'dragged-id',
            data: { current: { axis: 'filters', dimensionId: 'test' } },
        }

        const mockSortable: ReturnType<typeof useSortable> = {
            active,
            activeIndex: 0,
            index: 1,
            rect: { current: chipRect },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // pointerX = 120 + 0 = 120, before chip center at 150
        fireDragMove({ active, clientX: 120, deltaX: 0 })

        const marker = screen.getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
        expect(marker).not.toHaveClass(classes.atEnd)

        // Move to right side of chip (pointerX = 100 + 100 = 200 > 150)
        fireDragMove({ active, clientX: 100, deltaX: 100 })

        await waitFor(() => {
            expect(screen.queryByTestId('drop-insert-marker')).toHaveClass(
                classes.atEnd
            )
        })
    })

    it('should set marker at end after drag move past chip center', async () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const active = {
            id: 'dragged-id',
            data: { current: { axis: 'filters', dimensionId: 'test' } },
        }

        const setInsertAfter = vi.fn()
        const mockSortable: ReturnType<typeof useSortable> = {
            active,
            activeIndex: 0,
            index: 1,
            rect: { current: chipRect },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={setInsertAfter}
                axisId="columns"
            />
        )

        // pointerX = 120 + 0 = 120, before chip center at 150
        fireDragMove({ active, clientX: 120, deltaX: 0 })
        expect(screen.getByTestId('drop-insert-marker')).not.toHaveClass(
            classes.atEnd
        )

        // Move past chip center (pointerX = 50 + 150 = 200 > 150)
        fireDragMove({ active, clientX: 50, deltaX: 150 })

        await waitFor(() => {
            expect(screen.getByTestId('drop-insert-marker')).toHaveClass(
                classes.atEnd
            )
            expect(setInsertAfter).toHaveBeenCalledWith(true)
        })
    })

    it('should hide marker when drag move reveals adjacent no-op (before active)', async () => {
        const chipRect = createMockRect({ left: 100, width: 100 }) // center at 150
        const active = {
            id: 'dragged-id',
            data: { current: { axis: 'columns', dimensionId: 'test' } },
        }

        const mockSortable: ReturnType<typeof useSortable> = {
            active,
            activeIndex: 1,
            index: 0, // chip before active
            rect: { current: chipRect },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // Move past chip center (pointerX = 100 + 100 = 200 > 150)
        // insertAfter=true → adjacentIndex = 0+1 = 1 = activeIndex → no-op
        fireDragMove({ active, clientX: 100, deltaX: 100 })

        await waitFor(() => {
            expect(
                screen.queryByTestId('drop-insert-marker')
            ).not.toBeInTheDocument()
        })
    })

    it('should not render when hovering adjacent chip after active (no-op)', () => {
        const chipRect = createMockRect({ left: 100, width: 100 })
        const active = {
            id: 'dragged-id',
            data: { current: { axis: 'columns', dimensionId: 'test' } },
        }

        const mockSortable: ReturnType<typeof useSortable> = {
            active,
            activeIndex: 0,
            index: 1, // chip after active
            rect: { current: chipRect },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // pointerX = 120 + 0 = 120, before chip center → insertAfter=false
        // adjacentIndex = 1-1 = 0 = activeIndex → no-op
        fireDragMove({ active, clientX: 120, deltaX: 0 })

        expect(
            screen.queryByTestId('drop-insert-marker')
        ).not.toBeInTheDocument()
    })

    it('should render when hovering non-adjacent chip on same axis', () => {
        const chipRect = createMockRect({ left: 100, width: 100 })
        const active = {
            id: 'dragged-id',
            data: { current: { axis: 'columns', dimensionId: 'test' } },
        }

        const mockSortable: ReturnType<typeof useSortable> = {
            active,
            activeIndex: 0,
            index: 2,
            rect: { current: chipRect },
        } as any

        render(
            <DropInsertMarker
                sortable={mockSortable}
                setInsertAfter={vi.fn()}
                axisId="columns"
            />
        )

        // pointerX = 120 + 0 = 120, before chip center at 150
        fireDragMove({ active, clientX: 120, deltaX: 0 })

        const marker = screen.getByTestId('drop-insert-marker')
        expect(marker).toBeInTheDocument()
    })
})
