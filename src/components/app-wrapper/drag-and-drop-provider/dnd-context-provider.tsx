import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    type AutoScrollOptions,
} from '@dnd-kit/core'
import { type FC, type PropsWithChildren } from 'react'
import { collisionDetector } from './collision-detector'
import { DimensionDragOverlay } from './dimension-drag-overlay'
import { useOnDragEnd } from './use-on-drag-end'

const activateAt15pixels = {
    activationConstraint: {
        distance: 15,
    },
}

const DISABLE_AUTO_SCROLL_SELECTOR = '[data-dnd-auto-scroll="disabled"]'

const autoScrollOptions: AutoScrollOptions = {
    canScroll: (element) => !element.matches(DISABLE_AUTO_SCROLL_SELECTOR),
}

export const DndContextProvider: FC<PropsWithChildren> = ({ children }) => {
    // Wait 15px movement before starting drag, so that click event isn't overridden
    const sensor = useSensor(PointerSensor, activateAt15pixels)
    const sensors = useSensors(sensor)
    const onDragEnd = useOnDragEnd()

    return (
        <DndContext
            autoScroll={autoScrollOptions}
            collisionDetection={collisionDetector}
            sensors={sensors}
            onDragEnd={onDragEnd}
        >
            {children}
            <DimensionDragOverlay />
        </DndContext>
    )
}
