import { useDndMonitor, type Active, type ClientRect } from '@dnd-kit/core'
import type { useSortable } from '@dnd-kit/sortable'
import { isObject } from '@modules/validation'
import type { Axis } from '@types'
import cx from 'classnames'
import { useState, type FC } from 'react'
import classes from './styles/drop-insert-marker.module.css'

const getPointerX = (
    activatorEvent: Event | null | undefined,
    delta: { x: number } | undefined
): number | undefined => {
    if (
        !activatorEvent ||
        !delta ||
        !('clientX' in activatorEvent) ||
        typeof activatorEvent.clientX !== 'number'
    ) {
        return undefined
    }
    return activatorEvent.clientX + delta.x
}

const calculateInsertAfter = (
    pointerX: number | undefined,
    chipRect: ClientRect | null | undefined
): boolean => {
    if (pointerX === undefined || !chipRect) {
        return false
    }
    const chipCenterX = chipRect.left + chipRect.width / 2
    return pointerX > chipCenterX
}

const calculateShouldShowMarker = ({
    active,
    activeIndex,
    index,
    axisId,
    insertAfter,
}: {
    active: Active | null | undefined
    activeIndex: number | undefined
    index: number | undefined
    axisId: Axis | undefined
    insertAfter: boolean
}): boolean => {
    if (
        !active ||
        typeof activeIndex !== 'number' ||
        typeof index !== 'number' ||
        !axisId
    ) {
        return false
    }

    /* For elements from a different axis or the sidebar we can always
     * show the marker now */
    const draggedItemData = active.data.current // as DraggedItemEventData
    const isActiveElementFromSameAxis =
        isObject(draggedItemData) &&
        'axis' in draggedItemData &&
        draggedItemData.axis === axisId

    if (!isActiveElementFromSameAxis) {
        return true
    }

    /* When moving within an axis the items adjacent to the active item
     * need to be taken into account, since dropping after the previous
     * or before the next item is a no-op. */
    const adjacentIndex = insertAfter ? index + 1 : index - 1

    return adjacentIndex !== activeIndex
}

export const DropInsertMarker: FC<{
    sortable: ReturnType<typeof useSortable>
    setInsertAfter: (flag: boolean) => void
    axisId: Axis
}> = ({ sortable, setInsertAfter, axisId }) => {
    const { activeIndex, index, rect } = sortable
    const [shouldShowMarker, setShouldShowMarker] = useState(false)
    const [atEnd, setAtEnd] = useState(false)

    useDndMonitor({
        onDragMove(event) {
            const pointerX = getPointerX(event.activatorEvent, event.delta)
            const newInsertAfter = calculateInsertAfter(pointerX, rect.current)

            const newShouldShow = calculateShouldShowMarker({
                active: event.active,
                activeIndex,
                index,
                axisId,
                insertAfter: newInsertAfter,
            })

            if (newShouldShow !== shouldShowMarker) {
                setShouldShowMarker(newShouldShow)
            }

            if (newInsertAfter !== atEnd) {
                setAtEnd(newInsertAfter)
                setInsertAfter(newInsertAfter)
            }
        },
    })

    if (!shouldShowMarker) {
        return null
    }

    return (
        <span
            data-test="drop-insert-marker"
            className={cx(classes.marker, {
                [classes.atEnd]: atEnd,
            })}
        />
    )
}
