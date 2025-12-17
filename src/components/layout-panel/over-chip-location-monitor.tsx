import { useDndMonitor, type Active, type ClientRect } from '@dnd-kit/core'
import { useEffect, useRef, type FC } from 'react'

const calculateInsertAfter = (
    translatedRect: ClientRect | null,
    chipRect: ClientRect
): boolean => {
    if (!translatedRect) {
        return false
    }
    const chipCenterX = chipRect.left + chipRect.width / 2
    const draggedCenterX = translatedRect.left + translatedRect.width / 2
    return draggedCenterX > chipCenterX
}

export const OverChipLocationMonitor: FC<{
    setInsertAfter: (flag: boolean) => void
    rect: ClientRect
    active: Active
}> = ({ setInsertAfter, rect, active }) => {
    const shouldInsertAfterRef = useRef<boolean>(false)

    useEffect(() => {
        // Calculate initial position immediately on mount to prevent flash
        const initialInsertAfter = calculateInsertAfter(
            active.rect.current.translated,
            rect
        )
        shouldInsertAfterRef.current = initialInsertAfter
        setInsertAfter(initialInsertAfter)

        return () => {
            // Set to false on unmount
            setInsertAfter(false)
        }
    }, [setInsertAfter, rect, active])

    useDndMonitor({
        onDragMove(event) {
            const shouldInsertAfter = calculateInsertAfter(
                event.active.rect.current.translated,
                rect
            )

            if (shouldInsertAfterRef.current !== shouldInsertAfter) {
                shouldInsertAfterRef.current = shouldInsertAfter
                setInsertAfter(shouldInsertAfter)
            }
        },
        onDragEnd() {
            setInsertAfter(false)
        },
    })
    return null
}
