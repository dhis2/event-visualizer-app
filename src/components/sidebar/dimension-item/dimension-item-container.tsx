import cx from 'classnames'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import styles from './styles/dimension-item-container.module.css'

interface DimensionItemContainerProps extends ComponentPropsWithoutRef<'div'> {
    selected?: boolean
    multiSelected?: boolean
    isDragging?: boolean
    isDragOverlay?: boolean
}

export const DimensionItemContainer = forwardRef<
    HTMLDivElement,
    DimensionItemContainerProps
>(
    (
        {
            selected,
            multiSelected,
            isDragging,
            isDragOverlay,
            className,
            children,
            ...rest
        },
        ref
    ) => (
        <div
            ref={ref}
            className={cx(
                styles.container,
                {
                    [styles.selected]: selected,
                    [styles.multiSelected]: multiSelected,
                    [styles.dragging]: isDragging,
                    [styles.dragOverlay]: isDragOverlay,
                },
                className
            )}
            {...rest}
        >
            {children}
        </div>
    )
)

DimensionItemContainer.displayName = 'DimensionItemContainer'
