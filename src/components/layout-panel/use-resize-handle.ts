import { useCallback, useLayoutEffect, useRef, useState } from 'react'

type Orientation = 'horizontal' | 'vertical'

interface UseResizeHandleProps {
    max: number
    min: number
    collapseThreshold: number
    contentKey: string
    orientation: Orientation
    storageKey: string
}

export const useResizeHandle = ({
    max,
    min,
    collapseThreshold,
    contentKey,
    orientation,
    storageKey,
}: UseResizeHandleProps) => {
    const [size, setSize] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [minReached, setMinReached] = useState<boolean>(false)
    const nodeRef = useRef<HTMLDivElement | null>(null)
    const dragMaxRef = useRef<number>(max)
    const preDragSizeRef = useRef<number | null>(null)
    const dragStartPosRef = useRef<number | null>(null)
    const sizeRef = useRef<number | null>(size)
    const contentKeyRef = useRef<string>(contentKey)
    const refitPendingRef = useRef<boolean>(false)
    const storedSizeRef = useRef<number | null>(
        (() => {
            const storedSize = localStorage.getItem(storageKey)

            return storedSize ? Number(storedSize) : null
        })()
    )

    // Sync the ref with the size value
    sizeRef.current = size

    // Container ref callback
    // Computes the effective max size, based on the container, max and stored size
    const containerRef = useCallback(
        (node: HTMLDivElement | null) => {
            nodeRef.current = node

            if (node !== null) {
                const containerSize =
                    orientation === 'horizontal'
                        ? node.scrollHeight
                        : node.scrollWidth

                /* Fit to the content (which carries its own trailing drop-row
                 * buffer in CSS), capped at the max — then it scrolls. */
                const containerMaxSize = Math.min(containerSize, max)

                /* The min always wins: a stored size (possibly saved under a
                 * different visType) must never shrink the panel below the
                 * height needed to show every axis of the current visType. */
                if (storedSizeRef.current) {
                    setSize(
                        Math.max(
                            min,
                            Math.min(storedSizeRef.current, containerMaxSize)
                        )
                    )
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

    /* Re-fit the panel to the content whenever the layout changes, so it tracks
     * the chips (and the trailing drop-row buffer they carry in CSS) as they are
     * added or removed. The size is first dropped to `null` (auto) so the live
     * content can be measured without the current fixed height skewing it; the
     * next effect applies the fitted size once the auto layout has committed. */
    useLayoutEffect(() => {
        if (contentKeyRef.current === contentKey) {
            return
        }

        contentKeyRef.current = contentKey
        refitPendingRef.current = true
        setSize(null)
    }, [contentKey])

    useLayoutEffect(() => {
        if (!refitPendingRef.current || size !== null) {
            return
        }

        const node = nodeRef.current

        if (node === null) {
            return
        }

        refitPendingRef.current = false

        const contentSize =
            orientation === 'horizontal' ? node.scrollHeight : node.scrollWidth

        setSize(Math.max(min, Math.min(contentSize, max)))
    }, [size, min, max, orientation])

    // Start dragging
    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault()

            const node = nodeRef.current
            const horizontal = orientation === 'horizontal'

            /* The drag ceiling is recomputed from the live content on every
             * grab, so adding chips (which the cached size at mount can't see)
             * lets the panel be dragged taller. The content carries its own
             * trailing drop-row buffer in CSS. */
            let contentSize = max
            if (node) {
                contentSize = horizontal ? node.scrollHeight : node.scrollWidth
            }
            dragMaxRef.current = Math.min(contentSize, max)

            /* When the panel has no explicit size (after a double-click reset)
             * fall back to its rendered size so the drag starts smoothly
             * instead of jumping to the min. */
            let renderedSize: number | null = null
            if (node) {
                renderedSize = horizontal ? node.clientHeight : node.clientWidth
            }
            preDragSizeRef.current = sizeRef.current ?? renderedSize
            dragStartPosRef.current = horizontal ? event.clientY : event.clientX

            // This is important since the ResizeHandle presence might be toggled by minReached.
            // When ResizeHandle is available again and this it's draggable, we must avoid that minReached
            // triggers the logic in the consumer again whenever the hook updates.
            setMinReached(false)

            event.currentTarget.setPointerCapture(event.pointerId)

            setIsDragging(true)
        },
        [max, orientation]
    )

    // Move the drag handle
    const onPointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                return
            }

            const size = sizeRef.current

            /* Size is derived from the pointer's displacement since the grab,
             * not its absolute position. This keeps the drag direction honest:
             * dragging down can never produce a size smaller than the pre-drag
             * size, so the min-reached collapse only fires on a genuine upward
             * drag past the min. */
            const pointerPos =
                orientation === 'horizontal' ? event.clientY : event.clientX
            const delta = pointerPos - (dragStartPosRef.current ?? pointerPos)
            const newSize = (preDragSizeRef.current ?? size ?? min) + delta

            /* The panel can be dragged below the visType min (cutting into the
             * axes, which then scroll) all the way down to the collapse
             * threshold; only crossing that threshold collapses it. */
            if (
                newSize < collapseThreshold &&
                size &&
                size >= collapseThreshold
            ) {
                setSize(preDragSizeRef.current)

                setMinReached(true)
                setIsDragging(false)
            } else {
                setSize(
                    Math.max(
                        collapseThreshold,
                        Math.min(newSize, dragMaxRef.current)
                    )
                )
            }
        },
        [collapseThreshold, min, orientation]
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

        /* Re-fit to the content so a double-click reset matches the auto-fit
         * height applied elsewhere. */
        refitPendingRef.current = true

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
