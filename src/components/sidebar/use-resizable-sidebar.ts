import { useAppDispatch, useAppSelector } from '@hooks'
import { getUiSidebarWidth, setUiSidebarWidth } from '@store/ui-slice'
import { useCallback, useRef, useState } from 'react'
import { useWindowSize } from 'usehooks-ts'
import {
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_MAX_OFFSET,
    SIDEBAR_MIN_WIDTH,
} from './constants'

const clampWidth = (width: number, windowWidth: number) =>
    Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(width, windowWidth - SIDEBAR_MAX_OFFSET)
    )

export const useResizableSidebar = () => {
    /* The store holds the width the user picked; the rendered width is
     * clamped to the window. A drag stays local until pointer up and is only
     * saved if it changed the width. */
    const storeWidth = useAppSelector(getUiSidebarWidth)
    const [dragWidth, setDragWidth] = useState<number | null>(null)
    const { width: windowWidth } = useWindowSize({ debounceDelay: 150 })
    const restingWidth = clampWidth(storeWidth, windowWidth)
    const width = clampWidth(dragWidth ?? storeWidth, windowWidth)
    const dispatch = useAppDispatch()
    const startEdgePosRef = useRef(0)

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault()
            startEdgePosRef.current = event.clientX - restingWidth
            event.currentTarget.setPointerCapture(event.pointerId)
            setDragWidth(restingWidth)
        },
        [restingWidth]
    )

    const onPointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                return
            }
            setDragWidth(
                clampWidth(event.clientX - startEdgePosRef.current, windowWidth)
            )
        },
        [windowWidth]
    )

    const onPointerUp = useCallback(
        (event: React.PointerEvent) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
                const droppedWidth = clampWidth(
                    event.clientX - startEdgePosRef.current,
                    windowWidth
                )
                if (droppedWidth !== restingWidth) {
                    dispatch(setUiSidebarWidth(droppedWidth))
                }
            }
            setDragWidth(null)
        },
        [dispatch, restingWidth, windowWidth]
    )

    const onLostPointerCapture = useCallback(() => {
        setDragWidth(null)
    }, [])

    const onDoubleClick = useCallback(() => {
        dispatch(setUiSidebarWidth(SIDEBAR_DEFAULT_WIDTH))
    }, [dispatch])

    return {
        isDragging: dragWidth !== null,
        width,
        eventHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onLostPointerCapture,
            onDoubleClick,
        },
    }
}
