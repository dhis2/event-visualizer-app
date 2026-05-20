import { useAppDispatch, useAppSelector } from '@hooks'
import { getUiSidebarWidth, setUiSidebarWidth } from '@store/ui-slice'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import {
    SIDEBAR_DEBOUNCE_DELAY,
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_MAX_OFFSET,
    SIDEBAR_MIN_WIDTH,
} from './constants'
import {
    getSidebarWidthFromLocalStorage,
    setSidebarWidthToLocalStorage,
} from './local-storage'

const computeMaxWidth = () => window.innerWidth - SIDEBAR_MAX_OFFSET

const clampWidth = (width: number) =>
    Math.max(SIDEBAR_MIN_WIDTH, Math.min(width, computeMaxWidth()))

export const useResizableSidebar = () => {
    const [width, setWidth] = useState(getSidebarWidthFromLocalStorage)
    const [isDragging, setIsDragging] = useState(false)
    const dispatch = useAppDispatch()
    const containerRef = useRef<HTMLDivElement>(null)
    const startEdgePosRef = useRef(0)

    const onSync = useCallback(
        (value: number) => {
            setSidebarWidthToLocalStorage(value)
            dispatch(setUiSidebarWidth(value))
        },
        [dispatch]
    )
    const syncToStore = useDebounceCallback(onSync, SIDEBAR_DEBOUNCE_DELAY)

    // Re-clamp on window resize (handles monitor switches, window resizing)
    const onWindowResize = useDebounceCallback(() => {
        setWidth((prev) => clampWidth(prev))
    }, 150)

    const onPointerDown = useCallback((event: React.PointerEvent) => {
        event.preventDefault()
        const containerWidth =
            containerRef.current?.getBoundingClientRect().width ?? 0
        startEdgePosRef.current = event.clientX - containerWidth
        event.currentTarget.setPointerCapture(event.pointerId)
        setIsDragging(true)
    }, [])

    const onPointerMove = useCallback((event: React.PointerEvent) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return
        }
        setWidth(clampWidth(event.clientX - startEdgePosRef.current))
    }, [])

    const onPointerUp = useCallback((event: React.PointerEvent) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
        setIsDragging(false)
    }, [])

    const onDoubleClick = useCallback(() => {
        setWidth(clampWidth(SIDEBAR_DEFAULT_WIDTH))
    }, [])

    useEffect(() => {
        syncToStore(width)
    }, [width, syncToStore])

    // Respond to reset via View menu
    const storeWidth = useAppSelector(getUiSidebarWidth)
    useEffect(() => {
        if (storeWidth === SIDEBAR_DEFAULT_WIDTH) {
            setWidth(SIDEBAR_DEFAULT_WIDTH)
        }
    }, [storeWidth])

    useEffect(() => {
        window.addEventListener('resize', onWindowResize)
        return () => window.removeEventListener('resize', onWindowResize)
    }, [onWindowResize])

    return {
        containerRef,
        isDragging,
        width,
        eventHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onDoubleClick,
        },
    }
}
