import cx from 'classnames'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import styles from './styles/dimension-item-container.module.css'

interface DimensionItemContainerProps extends ComponentPropsWithoutRef<'div'> {
    selected?: boolean
    activeReference?: boolean
    multiSelected?: boolean
    disabled?: boolean
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
            activeReference,
            multiSelected,
            disabled,
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
                    [styles.activeReference]: activeReference,
                    [styles.multiSelected]: multiSelected,
                    [styles.disabled]: disabled,
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
