import { useDndMonitor } from '@dnd-kit/core'
import cx from 'classnames'
import { useRef, type FC } from 'react'
import classes from './styles/chip-end.module.css'

export const ChipEnd: FC<{
    setInsertAfter: (flag: boolean) => void
    isLastItem?: boolean
}> = ({ setInsertAfter, isLastItem }) => {
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
    return (
        <div
            className={cx(classes.container, {
                [classes.isLastItem]: isLastItem,
            })}
            ref={ref}
        />
    )
}
