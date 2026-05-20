import cx from 'classnames'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import styles from './styles/dimension-item-container.module.css'

interface DimensionItemContainerProps extends ComponentPropsWithoutRef<'div'> {
    selected?: boolean
    multiSelected?: boolean
    disabled?: boolean
    isDragging?: boolean
    isDragOverlay?: boolean
    dialogOpen?: boolean
}

export const DimensionItemContainer = forwardRef<
    HTMLDivElement,
    DimensionItemContainerProps
>(
    (
        {
            selected,
            multiSelected,
            disabled,
            isDragging,
            isDragOverlay,
            dialogOpen,
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
                    [styles.disabled]: disabled,
                    [styles.dragging]: isDragging,
                    [styles.dragOverlay]: isDragOverlay,
                    [styles.dialogOpen]: dialogOpen,
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
