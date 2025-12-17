import { useDndMonitor, type ClientRect } from '@dnd-kit/core'
import { useEffect, useRef, type FC } from 'react'

export const OverChipLocationMonitor: FC<{
    setInsertAfter: (flag: boolean) => void
    rect: ClientRect
}> = ({ setInsertAfter, rect }) => {
    const shouldInsertAfterRef = useRef<boolean>(false)

    useEffect(
        () => () => {
            // Set to false on unMount
            setInsertAfter(false)
        },
        [setInsertAfter]
    )

    useDndMonitor({
        onDragMove(event) {
            const translatedRect = event.active.rect.current.translated

            let shouldInsertAfter = false
            if (translatedRect) {
                const chipCenterX = rect.left + rect.width / 2
                const draggedCenterX =
                    translatedRect.left + translatedRect.width / 2
                shouldInsertAfter = draggedCenterX > chipCenterX
            }

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
