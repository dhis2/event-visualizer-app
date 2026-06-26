/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ClientRect, DroppableContainer } from '@dnd-kit/core'
import { describe, it, expect } from 'vitest'
import {
    collisionDetector,
    computeLineEndMatch,
    getIntersectionRatio,
} from '../collision-detector'
import type { AxisContainerDroppableData, AxisSortableData } from '../types'

describe('collision-detector', () => {
    const createMockRect = ({
        top,
        left,
        width,
        height,
    }: {
        top: number
        left: number
        width: number
        height: number
    }): ClientRect => ({
        top,
        left,
        width,
        height,
        bottom: top + height,
        right: left + width,
    })

    describe('getIntersectionRatio', () => {
        it('should return 0 when rectangles do not overlap', () => {
            const rect1 = createMockRect({
                top: 0,
                left: 0,
                width: 10,
                height: 10,
            })
            const rect2 = createMockRect({
                top: 20,
                left: 20,
                width: 10,
                height: 10,
            })

            expect(getIntersectionRatio(rect2, rect1)).toBe(0)
        })

        it('should return 0 when droppableContainerRect is null', () => {
            const rect = createMockRect({
                top: 0,
                left: 0,
                width: 10,
                height: 10,
            })

            expect(getIntersectionRatio(null, rect)).toBe(0)
        })

        it('should return value between 0-1 for partial overlap', () => {
            const rect1 = createMockRect({
                top: 0,
                left: 0,
                width: 20,
                height: 20,
            })
            const rect2 = createMockRect({
                top: 10,
                left: 10,
                width: 20,
                height: 20,
            })

            const ratio = getIntersectionRatio(rect2, rect1)
            expect(ratio).toBeGreaterThan(0)
            expect(ratio).toBeLessThan(1)
        })

        it('should return higher value for larger overlap', () => {
            const draggedRect = createMockRect({
                top: 0,
                left: 0,
                width: 100,
                height: 20,
            })
            const smallOverlap = createMockRect({
                top: 0,
                left: 90,
                width: 20,
                height: 20,
            }) // 10px overlap
            const largeOverlap = createMockRect({
                top: 0,
                left: 50,
                width: 60,
                height: 20,
            }) // 50px overlap

            const smallRatio = getIntersectionRatio(smallOverlap, draggedRect)
            const largeRatio = getIntersectionRatio(largeOverlap, draggedRect)

            expect(largeRatio).toBeGreaterThan(smallRatio)
        })

        it('should handle edge touching (no area overlap)', () => {
            const rect1 = createMockRect({
                top: 0,
                left: 0,
                width: 10,
                height: 10,
            })
            const rect2 = createMockRect({
                top: 0,
                left: 10,
                width: 10,
                height: 10,
            }) // Touching right edge

            expect(getIntersectionRatio(rect2, rect1)).toBe(0)
        })
    })

    describe('computeLineEndMatch', () => {
        const createMockChipContainer = ({
            id,
            rect,
            axis,
            index,
        }: {
            id: string
            rect: ClientRect
            axis: string
            index: number
        }): DroppableContainer => ({
            id,
            key: id,
            rect: { current: rect },
            data: {
                current: {
                    dimensionId: id,
                    axis,
                    overlayItemProps: {} as any,
                    insertAfter: false,
                    isLayoutBlocked: false,
                    sortable: { index, containerId: axis, items: [] },
                } as AxisSortableData,
            },
            node: { current: null },
            disabled: false,
        })

        const createMockAxisContainer = (
            axisId: string,
            rect: ClientRect
        ): DroppableContainer => ({
            id: axisId,
            key: axisId,
            rect: { current: rect },
            data: {
                current: {
                    axis: axisId,
                    isAxisContainer: true,
                } as AxisContainerDroppableData,
            },
            node: { current: null },
            disabled: false,
        })

        it('should find rightmost chip on the same vertical line', () => {
            const draggedRect = createMockRect({
                top: 10,
                left: 50,
                width: 100,
                height: 20,
            })
            const chip1 = createMockChipContainer({
                id: 'chip1',
                rect: createMockRect({
                    top: 10,
                    left: 160,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })
            const chip2 = createMockChipContainer({
                id: 'chip2',
                rect: createMockRect({
                    top: 10,
                    left: 250,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 1,
            })
            const chip3 = createMockChipContainer({
                id: 'chip3',
                rect: createMockRect({
                    top: 10,
                    left: 340,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 2,
            })

            const result = computeLineEndMatch({
                draggedItemRect: draggedRect,
                axis: 'rows',
                droppableContainers: [chip1, chip2, chip3],
            })

            expect(result?.id).toBe('chip3') // Rightmost chip
        })

        it('should find chip on closest line when dragging between lines', () => {
            // Line 1 at y=10
            const line1Chip = createMockChipContainer({
                id: 'line1',
                rect: createMockRect({
                    top: 10,
                    left: 0,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })
            // Line 2 at y=40
            const line2Chip = createMockChipContainer({
                id: 'line2',
                rect: createMockRect({
                    top: 40,
                    left: 0,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 1,
            })
            // Line 3 at y=70
            const line3Chip = createMockChipContainer({
                id: 'line3',
                rect: createMockRect({
                    top: 70,
                    left: 0,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 2,
            })

            // Dragging at y=42 (closest to line 2)
            const draggedRect = createMockRect({
                top: 42,
                left: 100,
                width: 100,
                height: 20,
            })

            const result = computeLineEndMatch({
                draggedItemRect: draggedRect,
                axis: 'rows',
                droppableContainers: [line1Chip, line2Chip, line3Chip],
            })

            expect(result?.id).toBe('line2')
        })

        it('should exclude chips from other axes', () => {
            const draggedRect = createMockRect({
                top: 10,
                left: 50,
                width: 100,
                height: 20,
            })
            const rowsChip = createMockChipContainer({
                id: 'rows-chip',
                rect: createMockRect({
                    top: 10,
                    left: 160,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })
            const columnsChip = createMockChipContainer({
                id: 'columns-chip',
                rect: createMockRect({
                    top: 10,
                    left: 250,
                    width: 80,
                    height: 20,
                }),
                axis: 'columns',
                index: 0,
            })

            const result = computeLineEndMatch({
                draggedItemRect: draggedRect,
                axis: 'rows',
                droppableContainers: [rowsChip, columnsChip],
            })

            expect(result?.id).toBe('rows-chip')
        })

        it('should exclude axis containers', () => {
            const draggedRect = createMockRect({
                top: 10,
                left: 50,
                width: 100,
                height: 20,
            })
            const chip = createMockChipContainer({
                id: 'chip',
                rect: createMockRect({
                    top: 10,
                    left: 160,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })
            const axisContainer = createMockAxisContainer(
                'rows',
                createMockRect({ top: 0, left: 0, width: 400, height: 100 })
            )

            const result = computeLineEndMatch({
                draggedItemRect: draggedRect,
                axis: 'rows',
                droppableContainers: [chip, axisContainer],
            })

            expect(result?.id).toBe('chip')
        })

        it('should return null when no chips found', () => {
            const draggedRect = createMockRect({
                top: 10,
                left: 50,
                width: 100,
                height: 20,
            })
            const axisContainer = createMockAxisContainer(
                'rows',
                createMockRect({ top: 0, left: 0, width: 400, height: 100 })
            )

            const result = computeLineEndMatch({
                draggedItemRect: draggedRect,
                axis: 'rows',
                droppableContainers: [axisContainer],
            })

            expect(result).toBeNull()
        })

        it('should handle multi-line layouts correctly', () => {
            // Line 1 at y=10 with chip extending far right
            const line1Chip = createMockChipContainer({
                id: 'line1',
                rect: createMockRect({
                    top: 10,
                    left: 300,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })
            // Line 2 at y=40 with short chip
            const line2Chip = createMockChipContainer({
                id: 'line2',
                rect: createMockRect({
                    top: 40,
                    left: 100,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 1,
            })
            // Line 3 at y=70 with chip extending far right
            const line3Chip = createMockChipContainer({
                id: 'line3',
                rect: createMockRect({
                    top: 70,
                    left: 300,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 2,
            })

            // Dragging over line 2's whitespace area
            const draggedRect = createMockRect({
                top: 40,
                left: 250,
                width: 100,
                height: 20,
            })

            const result = computeLineEndMatch({
                draggedItemRect: draggedRect,
                axis: 'rows',
                droppableContainers: [line1Chip, line2Chip, line3Chip],
            })

            expect(result?.id).toBe('line2')
        })
    })

    describe('collisionDetector', () => {
        const createMockChipContainer = ({
            id,
            rect,
            axis,
            index,
        }: {
            id: string
            rect: ClientRect
            axis: string
            index: number
        }): DroppableContainer => ({
            id,
            key: id,
            rect: { current: rect },
            data: {
                current: {
                    dimensionId: id,
                    axis,
                    overlayItemProps: {} as any,
                    insertAfter: false,
                    isLayoutBlocked: false,
                    sortable: { index, containerId: axis, items: [] },
                } as AxisSortableData,
            },
            node: { current: null },
            disabled: false,
        })

        const createMockAxisContainer = (
            axisId: string,
            rect: ClientRect
        ): DroppableContainer => ({
            id: axisId,
            key: axisId,
            rect: { current: rect },
            data: {
                current: {
                    axis: axisId,
                    isAxisContainer: true,
                } as AxisContainerDroppableData,
            },
            node: { current: null },
            disabled: false,
        })

        it('should return chip collision when pointer overlaps with a chip', () => {
            const chip1 = createMockChipContainer({
                id: 'chip1',
                rect: createMockRect({
                    top: 10,
                    left: 120,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })
            const chip2 = createMockChipContainer({
                id: 'chip2',
                rect: createMockRect({
                    top: 10,
                    left: 15,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 1,
            })

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [chip1, chip2],
            } as any)

            expect(collisions).toHaveLength(1)
            expect(collisions[0].id).toBe('chip2')
        })

        it('should return axis container collision when pointer is over empty axis', () => {
            const emptyAxis = createMockAxisContainer(
                'rows',
                createMockRect({ top: 0, left: 0, width: 400, height: 100 })
            )

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [emptyAxis],
            } as any)

            expect(collisions).toHaveLength(1)
            expect(collisions[0].id).toBe('rows')
        })

        it('should use computeLineEndMatch when over axis container with chips', () => {
            const axisContainer = createMockAxisContainer(
                'rows',
                createMockRect({ top: 0, left: 0, width: 400, height: 100 })
            )
            const chip = createMockChipContainer({
                id: 'chip',
                rect: createMockRect({
                    top: 10,
                    left: 100,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [axisContainer, chip],
            } as any)

            expect(collisions).toHaveLength(1)
            expect(collisions[0].id).toBe('chip')
        })

        it('should return empty array when no pointer coordinates', () => {
            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: null,
                droppableContainers: [],
            } as any)

            expect(collisions).toHaveLength(0)
        })

        it('should exclude the active container from collisions', () => {
            const chip1 = createMockChipContainer({
                id: 'chip1',
                rect: createMockRect({
                    top: 10,
                    left: 10,
                    width: 100,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })

            const active = {
                id: 'chip1', // Same as container
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [chip1],
            } as any)

            expect(collisions).toHaveLength(0)
        })

        it('should prioritize chip collisions over axis container collisions', () => {
            const axisContainer = createMockAxisContainer(
                'rows',
                createMockRect({ top: 0, left: 0, width: 400, height: 100 })
            )
            const chip = createMockChipContainer({
                id: 'chip',
                rect: createMockRect({
                    top: 10,
                    left: 10,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [axisContainer, chip],
            } as any)

            expect(collisions).toHaveLength(1)
            expect(collisions[0].id).toBe('chip')
        })

        it('skips a disabled axis container even if the pointer is directly over it', () => {
            const disabledAxis = {
                ...createMockAxisContainer(
                    'columns',
                    createMockRect({
                        top: 0,
                        left: 0,
                        width: 400,
                        height: 100,
                    })
                ),
                disabled: true,
            }

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [disabledAxis],
            } as any)

            expect(collisions).toHaveLength(0)
        })

        it('skips a disabled chip even if the pointer is directly over it', () => {
            const disabledChip = {
                ...createMockChipContainer({
                    id: 'chip-disabled',
                    rect: createMockRect({
                        top: 10,
                        left: 15,
                        width: 80,
                        height: 20,
                    }),
                    axis: 'columns',
                    index: 0,
                }),
                disabled: true,
            }

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [disabledChip],
            } as any)

            expect(collisions).toHaveLength(0)
        })

        it('falls back to a non-disabled axis when the disabled one would have won by overlap', () => {
            /* Both axes overlap the pointer rect. The disabled one has the
             * higher intersection ratio (it fully contains the pointer), but
             * the collision detector must pick the enabled one. */
            const disabledColumns = {
                ...createMockAxisContainer(
                    'columns',
                    createMockRect({
                        top: 0,
                        left: 0,
                        width: 100,
                        height: 100,
                    })
                ),
                disabled: true,
            }
            const enabledFilters = createMockAxisContainer(
                'filters',
                createMockRect({
                    top: 0,
                    left: 0,
                    width: 400,
                    height: 100,
                })
            )

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 50 },
                droppableContainers: [disabledColumns, enabledFilters],
            } as any)

            expect(collisions).toHaveLength(1)
            expect(collisions[0].id).toBe('filters')
        })

        it('uses computeLineEndMatch from an enabled axis even when the disabled-axis pointer overlap would dominate', () => {
            const disabledColumnsAxis = {
                ...createMockAxisContainer(
                    'columns',
                    createMockRect({
                        top: 0,
                        left: 0,
                        width: 100,
                        height: 50,
                    })
                ),
                disabled: true,
            }
            const enabledRowsAxis = createMockAxisContainer(
                'rows',
                createMockRect({
                    top: 0,
                    left: 0,
                    width: 400,
                    height: 100,
                })
            )
            const rowsChip = createMockChipContainer({
                id: 'rows-chip',
                rect: createMockRect({
                    top: 10,
                    left: 200,
                    width: 80,
                    height: 20,
                }),
                axis: 'rows',
                index: 0,
            })

            const active = {
                id: 'dragged',
            } as any

            const collisions = collisionDetector({
                active,
                pointerCoordinates: { x: 50, y: 20 },
                droppableContainers: [
                    disabledColumnsAxis,
                    enabledRowsAxis,
                    rowsChip,
                ],
            } as any)

            expect(collisions).toHaveLength(1)
            expect(collisions[0].id).toBe('rows-chip')
        })
    })
})
