import { useDndMonitor, type Active, type ClientRect } from '@dnd-kit/core'
import type { useSortable } from '@dnd-kit/sortable'
import cx from 'classnames'
import { useEffect, useState, type FC } from 'react'
import classes from './styles/insert-marker.module.css'
import type { DraggedItemEventData } from '@components/app-wrapper/drag-and-drop-provider/types'
import type { Axis } from '@types'

const calculateInsertAfter = (
    translatedRect: ClientRect | null | undefined,
    chipRect: ClientRect | null | undefined
): boolean => {
    if (!translatedRect || !chipRect) {
        return false
    }
    const chipCenterX = chipRect.left + chipRect.width / 2
    const draggedCenterX = translatedRect.left + translatedRect.width / 2
    return draggedCenterX > chipCenterX
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
    const draggedItemData = active.data.current as DraggedItemEventData
    const isActiveElementFromSameAxis =
        'axis' in draggedItemData && draggedItemData.axis === axisId

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
    const { active, activeIndex, index, rect } = sortable
    const [shouldShowMarker, setShouldShowMarker] = useState(false)
    const [atEnd, setAtEnd] = useState(false)

    useEffect(() => {
        // Calculate initial visibility and position on mount
        const initialInsertAfter = calculateInsertAfter(
            active?.rect.current.translated,
            rect.current
        )
        const initialShouldShow = calculateShouldShowMarker({
            active,
            activeIndex,
            index,
            axisId,
            insertAfter: initialInsertAfter,
        })

        setShouldShowMarker(initialShouldShow)
        setAtEnd(initialInsertAfter)

        if (initialInsertAfter) {
            setInsertAfter(true)
        }

        return () => {
            setInsertAfter(false)
        }
    }, [active, activeIndex, index, axisId, rect, setInsertAfter])

    useDndMonitor({
        onDragMove(event) {
            // Calculate position first
            const newInsertAfter = calculateInsertAfter(
                event.active.rect.current.translated,
                rect.current
            )

            // Then use it to determine visibility
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
            className={cx(classes.marker, {
                [classes.atEnd]: atEnd,
            })}
        />
    )
}
