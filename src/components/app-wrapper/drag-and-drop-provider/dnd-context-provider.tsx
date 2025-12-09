import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    type ClientRect,
    type Collision,
    type DroppableContainer,
    type CollisionDetection,
} from '@dnd-kit/core'
import { type FC, type PropsWithChildren } from 'react'
import { DimensionDragOverlay } from './dimension-drag-overlay'

const getIntersectionRatio = (
    droppableContainerRect: ClientRect | null,
    pointerRect: ClientRect
) => {
    if (droppableContainerRect === null) {
        return 0
    }

    const top = Math.max(pointerRect.top, droppableContainerRect.top)
    const left = Math.max(pointerRect.left, droppableContainerRect.left)
    const right = Math.min(
        pointerRect.left + pointerRect.width,
        droppableContainerRect.left + droppableContainerRect.width
    )
    const bottom = Math.min(
        pointerRect.top + pointerRect.height,
        droppableContainerRect.top + droppableContainerRect.height
    )
    const width = right - left
    const height = bottom - top

    if (left < right && top < bottom) {
        const targetArea = pointerRect.width * pointerRect.height
        const entryArea =
            droppableContainerRect.width * droppableContainerRect.height
        const intersectionArea = width * height
        const intersectionRatio =
            intersectionArea / (targetArea + entryArea - intersectionArea)
        return Number(intersectionRatio.toFixed(4))
    } // Rectangles do not overlap, or overlap has an area of zero (edge/corner overlap)

    return 0
}
type CollisionWithIntersectionRatio = Collision & {
    data: {
        droppableContainer: DroppableContainer
        value: number
    }
}
const sortCollisionsDesc = (
    a: CollisionWithIntersectionRatio,
    b: CollisionWithIntersectionRatio
) => b.data.value - a.data.value

export const rectIntersectionCustom: CollisionDetection = ({
    pointerCoordinates,
    droppableContainers,
}) => {
    if (!pointerCoordinates) {
        return []
    }
    // create a rect around the pointerCoords for calculating the intersection
    const pointerRect: ClientRect = {
        width: 80,
        height: 40,
        top: pointerCoordinates.y - 20,
        bottom: pointerCoordinates.y + 20,
        left: pointerCoordinates.x - 40,
        right: pointerCoordinates.x + 40,
    }
    return droppableContainers
        .reduce((collisions, droppableContainer) => {
            const intersectionRatio = getIntersectionRatio(
                droppableContainer.rect.current,
                pointerRect
            )

            if (intersectionRatio > 0) {
                collisions.push({
                    id: droppableContainer.id,
                    data: {
                        droppableContainer,
                        value: intersectionRatio,
                    },
                })
            }

            return collisions
        }, [] as CollisionWithIntersectionRatio[])
        .sort(sortCollisionsDesc)
}

const activateAt15pixels = {
    activationConstraint: {
        distance: 15,
    },
}

export const DndContextProvider: FC<PropsWithChildren> = ({ children }) => {
    // Wait 15px movement before starting drag, so that click event isn't overridden
    const sensor = useSensor(PointerSensor, activateAt15pixels)
    const sensors = useSensors(sensor)

    return (
        <DndContext
            collisionDetection={rectIntersectionCustom}
            sensors={sensors}
        >
            {children}
            <DimensionDragOverlay />
        </DndContext>
    )
}
