import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import { useAppDispatch } from '@hooks'
import { setUiMainSidebarWidth } from '@store/ui-slice'

const DEFAULT_WIDTH = 400
const MIN_WIDTH = 200
const MAX_OFFSET = 580
const DEBOUNCE_DELAY = 600
const STORAGE_KEY = 'dhis2.event-visualizer.mainSidebarWidth'

const computeMaxWidth = () => window.innerWidth - MAX_OFFSET

const clampWidth = (width: number) =>
    Math.max(MIN_WIDTH, Math.min(width, computeMaxWidth()))

export const getInitialMainSidebarWidth = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return clampWidth(stored !== null ? Number(stored) : DEFAULT_WIDTH)
}

const persistWidth = (width: number) => {
    try {
        localStorage.setItem(STORAGE_KEY, String(Math.round(width)))
    } catch {
        // ignore
    }
}

export const useResizableSidebar = () => {
    const [width, setWidth] = useState(getInitialMainSidebarWidth)
    const [isDragging, setIsDragging] = useState(false)
    const dispatch = useAppDispatch()
    const containerRef = useRef<HTMLDivElement>(null)
    const startEdgePosRef = useRef(0)

    const syncToStore = useDebounceCallback((value: number) => {
        persistWidth(value)
        dispatch(setUiMainSidebarWidth(value))
    }, DEBOUNCE_DELAY)

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
        setWidth(clampWidth(DEFAULT_WIDTH))
    }, [])

    useEffect(() => {
        syncToStore(width)
    }, [width, syncToStore])

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
