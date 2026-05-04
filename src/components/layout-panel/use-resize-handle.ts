import { useCallback, useRef, useState } from 'react'

type Orientation = 'horizontal' | 'vertical'

interface UseResizeHandleProps {
    min: number
    orientation: Orientation
    storageKey: string
}

const readStoredSize = (storageKey: string): number | null => {
    try {
        const stored = localStorage.getItem(storageKey)
        const parsed = stored !== null ? Number(stored) : NaN
        return Number.isFinite(parsed) ? parsed : null
    } catch {
        return null
    }
}

/* When no natural-size measurement has been recorded yet, treat the cap as
 * unbounded so the user-set size is not clamped down to 0 prematurely. */
const UNCAPPED = Number.POSITIVE_INFINITY

/* Resizable handle behavior shared by axes / sidebar style panels.
 *
 * The default state (size === null) is intended to be CSS-driven: the consumer
 * lets layout grow naturally, capped by some max-block-size / max-inline-size
 * rule. An explicit `size` is only set once the user drags the handle (or had
 * previously dragged it and the value was restored from storage). The hook
 * never imposes its own default cap; the natural content size is used as the
 * upper clamp during drag, observed via a ResizeObserver on the content node.
 */
export const useResizeHandle = ({
    min,
    orientation,
    storageKey,
}: UseResizeHandleProps) => {
    const [size, setSize] = useState<number | null>(() =>
        readStoredSize(storageKey)
    )
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [minReached, setMinReached] = useState<boolean>(false)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const contentSizeRef = useRef<number>(UNCAPPED)
    const observerRef = useRef<ResizeObserver | null>(null)
    const containerEdgePosRef = useRef<number>(0)
    const preDragSizeRef = useRef<number | null>(null)
    const sizeRef = useRef<number | null>(size)

    sizeRef.current = size

    /* Callback ref for the natural-sized inner node. The ResizeObserver
     * tracks its rendered size; when the user-set size exceeds the natural
     * content size, we clamp it down (e.g. content shrinks after viz type
     * change, removed chips, etc.) so the panel cannot leave empty space. */
    const contentRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) {
                observerRef.current.disconnect()
                observerRef.current = null
            }

            if (node === null) {
                contentSizeRef.current = UNCAPPED
                return
            }

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0]
                if (!entry) {
                    return
                }

                const naturalSize =
                    orientation === 'horizontal'
                        ? entry.contentRect.height
                        : entry.contentRect.width

                contentSizeRef.current = naturalSize

                const current = sizeRef.current
                if (current !== null && current > naturalSize) {
                    setSize(Math.max(min, naturalSize))
                }
            })

            observer.observe(node)
            observerRef.current = observer
        },
        [min, orientation]
    )

    const resetSize = useCallback(() => {
        setSize(null)
        setMinReached(false)
    }, [])

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault()

            const containerNode = containerRef.current
            if (!containerNode) {
                return
            }

            const rect = containerNode.getBoundingClientRect()
            containerEdgePosRef.current =
                orientation === 'horizontal' ? rect.top : rect.left

            /* Preserve the pre-drag state verbatim — including null when
             * the user has not customised the size. On minReached we
             * restore this so the stored default (or absence of one) is
             * preserved across a collapse-trigger drag. */
            preDragSizeRef.current = sizeRef.current

            setMinReached(false)

            event.currentTarget.setPointerCapture(event.pointerId)

            setIsDragging(true)
        },
        [orientation]
    )

    const onPointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                return
            }

            if (!containerEdgePosRef.current) {
                return
            }

            const newSize =
                (orientation === 'horizontal' ? event.clientY : event.clientX) -
                containerEdgePosRef.current

            if (newSize < min) {
                /* Restore pre-drag size verbatim so the stored "default"
                 * value is preserved across a collapse-trigger drag. If the
                 * pre-drag state was the CSS default (null), we restore
                 * null so the layout returns to default on re-expand. */
                setSize(preDragSizeRef.current)
                setMinReached(true)
                setIsDragging(false)
            } else {
                setSize(
                    Math.max(min, Math.min(newSize, contentSizeRef.current))
                )
            }
        },
        [min, orientation]
    )

    const onPointerUp = useCallback(
        (event: React.PointerEvent) => {
            const finalSize = sizeRef.current

            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
            }

            if (finalSize !== null) {
                try {
                    localStorage.setItem(storageKey, finalSize.toFixed())
                } catch {
                    // ignore
                }
            }

            setIsDragging(false)
        },
        [storageKey]
    )

    const onDoubleClick = useCallback(() => {
        try {
            localStorage.removeItem(storageKey)
        } catch {
            // ignore
        }

        resetSize()
    }, [resetSize, storageKey])

    return {
        containerRef,
        contentRef,
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
