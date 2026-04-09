import { useAppDispatch, useAppSelector } from '@hooks'
import { getUiMainSidebarWidth, setUiMainSidebarWidth } from '@store/ui-slice'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import {
    MAIN_SIDEBAR_DEBOUNCE_DELAY,
    MAIN_SIDEBAR_DEFAULT_WIDTH,
    MAIN_SIDEBAR_MAX_OFFSET,
    MAIN_SIDEBAR_MIN_WIDTH,
} from './constants'
import {
    getMainSidebarWidthFromLocalStorage,
    setMainSidebarWidthToLocalStorage,
} from './local-storage'

const computeMaxWidth = () => window.innerWidth - MAIN_SIDEBAR_MAX_OFFSET

const clampWidth = (width: number) =>
    Math.max(MAIN_SIDEBAR_MIN_WIDTH, Math.min(width, computeMaxWidth()))

export const useResizableSidebar = () => {
    const [width, setWidth] = useState(getMainSidebarWidthFromLocalStorage)
    const [isDragging, setIsDragging] = useState(false)
    const dispatch = useAppDispatch()
    const containerRef = useRef<HTMLDivElement>(null)
    const startEdgePosRef = useRef(0)

    const syncToStore = useDebounceCallback((value: number) => {
        setMainSidebarWidthToLocalStorage(value)
        dispatch(setUiMainSidebarWidth(value))
    }, MAIN_SIDEBAR_DEBOUNCE_DELAY)

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
        setWidth(clampWidth(MAIN_SIDEBAR_DEFAULT_WIDTH))
    }, [])

    useEffect(() => {
        syncToStore(width)
    }, [width, syncToStore])

    // Respond to reset via View menu
    const storeWidth = useAppSelector(getUiMainSidebarWidth)
    useEffect(() => {
        if (storeWidth === MAIN_SIDEBAR_DEFAULT_WIDTH) {
            setWidth(MAIN_SIDEBAR_DEFAULT_WIDTH)
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
