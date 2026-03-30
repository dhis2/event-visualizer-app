import cx from 'classnames'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import styles from './styles/dimension-item-container.module.css'

interface DimensionItemContainerProps extends ComponentPropsWithoutRef<'div'> {
    selected?: boolean
    disabled?: boolean
    isDragging?: boolean
}

export const DimensionItemContainer = forwardRef<
    HTMLDivElement,
    DimensionItemContainerProps
>(({ selected, disabled, isDragging, className, children, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx(
            styles.container,
            {
                [styles.selected]: selected,
                [styles.disabled]: disabled,
                [styles.dragging]: isDragging,
            },
            className
        )}
        {...rest}
    >
        {children}
    </div>
))

DimensionItemContainer.displayName = 'DimensionItemContainer'
