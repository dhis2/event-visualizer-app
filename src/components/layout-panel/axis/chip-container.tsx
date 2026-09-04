import cx from 'classnames'
import { forwardRef, type ComponentPropsWithoutRef, type FC } from 'react'
import styles from './styles/chip-container.module.css'

// Presentational chip box shared by the layout Chip and its drag overlay clone.
// Do not add redux or dnd functionality here.

interface ChipContainerProps extends ComponentPropsWithoutRef<'div'> {
    isEmpty?: boolean
    isDragging?: boolean
    showBlank?: boolean
}

export const ChipContainer = forwardRef<HTMLDivElement, ChipContainerProps>(
    ({ isEmpty, isDragging, showBlank, className, children, ...rest }, ref) => (
        <div
            ref={ref}
            className={cx(
                styles.chip,
                {
                    [styles.chipEmpty]: isEmpty,
                    [styles.active]: isDragging,
                    [styles.showBlank]: showBlank,
                },
                className
            )}
            {...rest}
        >
            {children}
        </div>
    )
)

ChipContainer.displayName = 'ChipContainer'

export const ChipContent: FC<ComponentPropsWithoutRef<'div'>> = ({
    className,
    children,
    ...rest
}) => (
    <div className={cx(styles.content, className)} {...rest}>
        {children}
    </div>
)
