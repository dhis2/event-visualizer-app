import cx from 'classnames'
import type { FC, HTMLAttributes } from 'react'
import classes from './styles/resize-handle.module.css'

type Orientation = 'horizontal' | 'vertical'

interface ResizeHandleProps extends HTMLAttributes<HTMLDivElement> {
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
