import cx from 'classnames'
import { useCallback, useRef, useState, type FC } from 'react'
import classes from './styles/resize-handle.module.css'

type Orientation = 'horizontal' | 'vertical'

interface ResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
    ariaLabel?: string
    isDragging: boolean
    orientation: Orientation
}

export const ResizeHandle: FC<ResizeHandleProps> = ({
    ariaLabel,
    isDragging,
    orientation,
    ...rest
}) => (
    <div
        {...rest}
        className={cx(classes.resizeHandle, {
            [classes.active]: isDragging,
            [classes.horizontal]: orientation === 'horizontal',
            [classes.vertical]: orientation === 'vertical',
        })}
        aria-orientation={orientation}
        aria-label={ariaLabel}
        style={{ touchAction: 'none' }}
    />
)

interface UseResizeHandleProps {
    max: number
    min: number
    orientation: Orientation
    storageKey: string
}

export const useResizeHandle = ({
    max,
    min,
    orientation,
    storageKey,
}: UseResizeHandleProps) => {
    const [size, setSize] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [minReached, setMinReached] = useState<boolean>(false)
    const containerEdgePosRef = useRef<number>(0)
    const containerMaxSizeRef = useRef<number>(max)
    const preDragSizeRef = useRef<number | null>(null)
    const sizeRef = useRef<number | null>(size)
    const storedSizeRef = useRef<number | null>(
        (() => {
                const storedSize = localStorage.getItem(storageKey)

                return storedSize ?Number(storedSize) : null
        })()
    )

    // Sync the ref with the size value
    sizeRef.current = size

    // Container ref callback
    // Computes the effective max size, based on the container, max and stored size
    const containerRef = useCallback(
        (node) => {
            if (node !== null) {
                // Store the container edge position to avoid calculating it on each pointer move
                containerEdgePosRef.current =
                    orientation === 'horizontal'
                        ? node.getBoundingClientRect().top
                        : node.getBoundingClientRect().left

                const containerSize =
                    orientation === 'horizontal'
                        ? node.scrollHeight
                        : node.scrollWidth

                const containerMaxSize = Math.min(containerSize, max)

                containerMaxSizeRef.current = containerMaxSize

                if (storedSizeRef.current) {
                    setSize(Math.min(storedSizeRef.current, containerMaxSize))
                } else {
                    setSize(Math.max(containerMaxSize, min))
                }
            }
        },
        [max, min, orientation]
    )

    // Callback for resetting the size, it's returned by the hook.
    // This is handy for resetting the internal size value from the consumer of the hook.
    // For example in the Axes component when switching visualization, this solves the issue of the container
    // having empty space when a bigger size is stored from a previous visualization.
    // Resetting the size causes the container to not have a defined height (auto is used) and the real height is then
    // computed in the containerRef callback.
    const resetSize = useCallback(() => {
        setSize(null)
        setMinReached(false)
    }, [])

    // Start dragging
    const onPointerDown = useCallback((event: React.PointerEvent) => {
        event.preventDefault()

        preDragSizeRef.current = sizeRef.current

        // This is important since the ResizeHandle presence might be toggled by minReached.
        // When ResizeHandle is available again and this it's draggable, we must avoid that minReached
        // triggers the logic in the consumer again whenever the hook updates.
        setMinReached(false)

        event.currentTarget.setPointerCapture(event.pointerId)

        setIsDragging(true)
    }, [])

    // Move the drag handle
    const onPointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                return
            }

            if (!containerEdgePosRef.current) {
                return
            }

            const size = sizeRef.current

            const newSize =
                (orientation === 'horizontal' ? event.clientY : event.clientX) -
                containerEdgePosRef.current

            // Trigger minReached only when shrinking the container
            if (newSize < min && size && size >= min) {
                setSize(preDragSizeRef.current)

                setMinReached(true)
                setIsDragging(false)
            } else {
                setSize(
                    Math.max(
                        min,
                        Math.min(newSize, containerMaxSizeRef.current)
                    )
                )
            }
        },
        [min, orientation]
    )

    // Stop dragging
    const onPointerUp = useCallback(
        (event: React.PointerEvent) => {
            const size = sizeRef.current

            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
            }

            if (size) {
                try {
                    storedSizeRef.current = +size.toFixed()

                    localStorage.setItem(storageKey, size.toFixed())
                } catch {
                    // ignore
                }
            }

            setIsDragging(false)
        },
        [storageKey]
    )

    // Reset
    const onDoubleClick = useCallback(() => {
        try {
            localStorage.removeItem(storageKey)
        } catch {
            // ignore
        }

        storedSizeRef.current = null

        resetSize()
    }, [resetSize, storageKey])

    return {
        containerRef,
        size,
        resetSize,
        isDragging,
        minReached,
        eventHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onDoubleClick,
        },
    }
}
