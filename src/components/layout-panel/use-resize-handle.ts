import { useAppDispatch, useAppSelector, useAppStore } from '@hooks'
import { getUiLayoutPanelHeight, setUiLayoutPanelHeight } from '@store/ui-slice'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { setLayoutPanelHeightToLocalStorage } from './local-storage'

type Orientation = 'horizontal' | 'vertical'

interface UseResizeHandleProps {
    max: number
    min: number
    collapseThreshold: number
    contentKey: string
    orientation: Orientation
}

export const useResizeHandle = ({
    max,
    min,
    collapseThreshold,
    contentKey,
    orientation,
}: UseResizeHandleProps) => {
    const dispatch = useAppDispatch()
    const store = useAppStore()
    const storeHeight = useAppSelector(getUiLayoutPanelHeight)

    const [size, setSize] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [minReached, setMinReached] = useState<boolean>(false)
    const nodeRef = useRef<HTMLDivElement | null>(null)
    const preDragSizeRef = useRef<number | null>(null)
    const dragStartPosRef = useRef<number | null>(null)
    const sizeRef = useRef<number | null>(size)
    const contentKeyRef = useRef<string>(contentKey)
    const refitPendingRef = useRef<boolean>(false)

    sizeRef.current = size

    /* On node attach, apply the user-set height — clamped to the visType min and
     * the max, where the min always wins so a height saved under a shorter
     * visType can't hide an axis of the current one. With no user-set height
     * (AUTO_FIT) fit to the content, capped at the max — then it scrolls. */
    const containerRef = useCallback(
        (node: HTMLDivElement | null) => {
            nodeRef.current = node

            if (node === null) {
                return
            }

            const userHeight = getUiLayoutPanelHeight(store.getState())

            if (userHeight !== 'AUTO_FIT') {
                setSize(Math.max(min, Math.min(userHeight, max)))

                return
            }

            const containerSize =
                orientation === 'horizontal'
                    ? node.scrollHeight
                    : node.scrollWidth

            setSize(Math.max(min, Math.min(containerSize, max)))
        },
        [max, min, orientation, store]
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

    /* Auto-fit the panel to the content when the layout changes, so it tracks
     * the chips as they are added or removed. This only applies while the user
     * has not set a height of their own: once they resize the panel, that
     * explicit height wins and the content scrolls within it instead of resizing
     * the panel. The size is first dropped to `null` (auto) so the live content
     * can be measured without the current fixed height skewing it; the next
     * effect applies the fitted size once the auto layout has committed. */
    useLayoutEffect(() => {
        if (contentKeyRef.current === contentKey) {
            return
        }

        contentKeyRef.current = contentKey

        if (getUiLayoutPanelHeight(store.getState()) !== 'AUTO_FIT') {
            return
        }

        refitPendingRef.current = true
        setSize(null)
    }, [contentKey, store])

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

    /* React to AUTO_FIT being published to the store — by "Resize layout to fit"
     * in the View menu, or by this hook's own reset — and re-fit to the content.
     * Guarded on a mounted node so it can't leave a refit pending while the panel
     * is unmounted; a numeric user height is applied on node attach and during
     * the drag, so it needs no reaction here. */
    useLayoutEffect(() => {
        if (storeHeight === 'AUTO_FIT' && nodeRef.current !== null) {
            refitPendingRef.current = true
            resetSize()
        }
    }, [storeHeight, resetSize])

    // Start dragging
    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault()

            const node = nodeRef.current
            const horizontal = orientation === 'horizontal'

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
        [orientation]
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
                setSize(Math.max(collapseThreshold, Math.min(newSize, max)))
            }
        },
        [collapseThreshold, max, min, orientation]
    )

    // Stop dragging
    const onPointerUp = useCallback(
        (event: React.PointerEvent) => {
            const size = sizeRef.current

            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
            }

            if (size) {
                const height = Math.round(size)

                dispatch(setUiLayoutPanelHeight(height))
                setLayoutPanelHeightToLocalStorage(height)
            }

            setIsDragging(false)
        },
        [dispatch]
    )

    /* Discard the user's height and re-fit to the content by publishing AUTO_FIT
     * (the refit itself runs in the reaction effect above, shared with the View
     * menu's "Resize layout to fit"). Bound to the resize handle's double-click. */
    const resetToContentHeight = useCallback(() => {
        dispatch(setUiLayoutPanelHeight('AUTO_FIT'))
        setLayoutPanelHeightToLocalStorage('AUTO_FIT')
    }, [dispatch])

    return {
        containerRef,
        size,
        resetSize,
        resetToContentHeight,
        isDragging,
        minReached,
        eventHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onDoubleClick: resetToContentHeight,
        },
    }
}
