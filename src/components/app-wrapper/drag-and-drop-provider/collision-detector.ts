import type {
    ClientRect,
    Collision,
    CollisionDetection,
    DroppableContainer,
} from '@dnd-kit/core'
import type { AxisContainerDroppableData } from './types'
import { isAxisContainerData } from './use-on-drag-end'

const VERTICAL_PADDING = 9

/**
 * Calculates the intersection ratio (IoU - Intersection over Union) between two rectangles.
 * Returns a value between 0 (no overlap) and 1 (perfect overlap).
 * @internal Exported for testing
 */
export const getIntersectionRatio = (
    droppableContainerRect: ClientRect | null,
    draggedItemRect: ClientRect
): number => {
    if (droppableContainerRect === null) {
        return 0
    }

    // Calculate intersection bounds
    const intersectionTop = Math.max(
        draggedItemRect.top,
        droppableContainerRect.top
    )
    const intersectionLeft = Math.max(
        draggedItemRect.left,
        droppableContainerRect.left
    )
    const intersectionRight = Math.min(
        draggedItemRect.right,
        droppableContainerRect.right
    )
    const intersectionBottom = Math.min(
        draggedItemRect.bottom,
        droppableContainerRect.bottom
    )

    // Check if rectangles actually overlap
    const hasOverlap =
        intersectionLeft < intersectionRight &&
        intersectionTop < intersectionBottom

    if (!hasOverlap) {
        return 0
    }

    // Calculate areas
    const intersectionArea =
        (intersectionRight - intersectionLeft) *
        (intersectionBottom - intersectionTop)
    const draggedItemArea = draggedItemRect.width * draggedItemRect.height
    const droppableContainerArea =
        droppableContainerRect.width * droppableContainerRect.height

    // IoU formula: intersection / union
    const unionArea =
        draggedItemArea + droppableContainerArea - intersectionArea

    return intersectionArea / unionArea
}

/**
 * Finds the rightmost chip on the line closest to the dragged item's vertical position.
 * @internal Exported for testing
 */
export const computeLineEndMatch = ({
    draggedItemRect,
    axis,
    droppableContainers,
}: {
    draggedItemRect: ClientRect
    axis: string
    droppableContainers: DroppableContainer[]
}): DroppableContainer | null => {
    const draggedCenterY = draggedItemRect.top + draggedItemRect.height / 2
    const dropContainersByVerticalPosition = new Map<
        number,
        Array<{ right: number; container: DroppableContainer }>
    >()
    let closestVerticalPosition: number | null = null
    let minDeltaY = Infinity

    for (const container of droppableContainers) {
        const data = container.data.current
        const rect = container.rect.current

        if (!data || !rect) {
            continue
        }

        const isAxisDroppableContainer = isAxisContainerData(data)
        const isInOtherAxis = !('axis' in data) || data.axis !== axis

        if (isAxisDroppableContainer || isInOtherAxis) {
            continue
        }

        // Calculate vertical center and round to avoid decimal mismatches
        const verticalCenter = Math.round(rect.top + rect.height / 2)
        const deltaY = Math.abs(verticalCenter - draggedCenterY)

        // Track closest vertical position
        if (deltaY < minDeltaY) {
            minDeltaY = deltaY
            closestVerticalPosition = verticalCenter
        }

        // Add to map
        if (!dropContainersByVerticalPosition.has(verticalCenter)) {
            dropContainersByVerticalPosition.set(verticalCenter, [])
        }
        dropContainersByVerticalPosition.get(verticalCenter)!.push({
            right: rect.right,
            container,
        })
    }

    // If no containers found, return null
    if (closestVerticalPosition === null) {
        return null
    }

    // Get containers on the closest line and find the rightmost
    const containersOnClosestLine = dropContainersByVerticalPosition.get(
        closestVerticalPosition
    )!
    const rightmostContainer = containersOnClosestLine.reduce(
        (rightmost, current) => {
            return current.right > rightmost.right ? current : rightmost
        }
    )
    console.log('rightmost', rightmostContainer.container)

    return rightmostContainer.container
}

export const collisionDetector: CollisionDetection = ({
    active,
    droppableContainers,
}) => {
    const collisions: Collision[] = []
    const activeRect = active.rect.current.translated

    if (!activeRect) {
        return collisions
    }

    // Use the dragged chip's dimensions with vertical padding for better collision detection
    const draggedItemRect: ClientRect = {
        width: activeRect.width,
        height: activeRect.height + VERTICAL_PADDING * 2,
        top: activeRect.top - VERTICAL_PADDING,
        bottom: activeRect.bottom + VERTICAL_PADDING,
        left: activeRect.left,
        right: activeRect.right,
    }
    let hoveredAxisDroppableContainer: DroppableContainer | null = null
    let hoveredItemDroppableContainer: DroppableContainer | null = null
    let maxAxisIntersectionRatio = 0
    let maxItemIntersectionRatio = 0

    for (const droppableContainer of droppableContainers) {
        const isActiveContainer = active.id === droppableContainer.id
        const intersectionRatio = isActiveContainer
            ? 0
            : getIntersectionRatio(
                  droppableContainer.rect.current,
                  draggedItemRect
              )
        const isOverAxisContainer =
            intersectionRatio > 0 &&
            isAxisContainerData(droppableContainer.data.current)

        if (
            isOverAxisContainer &&
            intersectionRatio > maxAxisIntersectionRatio
        ) {
            maxAxisIntersectionRatio = intersectionRatio
            hoveredAxisDroppableContainer = droppableContainer
        }

        if (
            !isOverAxisContainer &&
            intersectionRatio > maxItemIntersectionRatio
        ) {
            maxItemIntersectionRatio = intersectionRatio
            hoveredItemDroppableContainer = droppableContainer
        }
    }

    if (hoveredItemDroppableContainer) {
        collisions.push(hoveredItemDroppableContainer)
    } else if (
        !hoveredItemDroppableContainer &&
        hoveredAxisDroppableContainer
    ) {
        const axisData = hoveredAxisDroppableContainer.data
            .current as AxisContainerDroppableData
        const lineEndMatch = computeLineEndMatch({
            draggedItemRect,
            axis: axisData.axis,
            droppableContainers,
        })
        if (lineEndMatch) {
            collisions.push(lineEndMatch)
        } else {
            // No chip on the line, use the axis container itself (empty axis)
            collisions.push(hoveredAxisDroppableContainer)
        }
    }
    return collisions
}
