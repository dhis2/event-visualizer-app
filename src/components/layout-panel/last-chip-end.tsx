import { useDndMonitor } from '@dnd-kit/core'
import { useRef, type FC } from 'react'
import classes from './styles/last-chip-end.module.css'

export const LastChipEnd: FC<{ setInsertAfter: (flag: boolean) => void }> = ({
    setInsertAfter,
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const isOverRef = useRef<boolean | null>(null)
    useDndMonitor({
        onDragMove(event) {
            const rect = ref.current?.getBoundingClientRect()
            const activatorMouseEvent = event.activatorEvent as MouseEvent
            const cursorX = activatorMouseEvent.clientX + event.delta.x
            const cursorY = activatorMouseEvent.clientY + event.delta.y
            const isOver =
                !!rect &&
                cursorX >= rect.left &&
                cursorX <= rect.right &&
                cursorY >= rect.top &&
                cursorY <= rect.bottom

            if (isOverRef.current !== isOver) {
                isOverRef.current = isOver
                setInsertAfter(isOver)
            }
        },
        onDragEnd() {
            setInsertAfter(false)
        },
    })
    return <div className={classes.container} ref={ref} />
}
