import cx from 'classnames'
import type { ReactNode } from 'react'
import { CollapseIcon } from './collapse-icon'
import classes from './styles/dimension-card-header.module.css'

type DimensionCardHeaderProps = {
    children: ReactNode
    selectedCount: number
    isCollapsed: boolean
    onToggle: () => void
    isDisabled?: boolean
}

export const DimensionCardHeader = ({
    children,
    selectedCount,
    isCollapsed,
    onToggle,
    isDisabled = false,
}: DimensionCardHeaderProps) => {
    return (
        <button
            type="button"
            className={classes.container}
            onClick={onToggle}
            aria-expanded={!isCollapsed}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            data-test="dimension-card-header"
        >
            <CollapseIcon isCollapsed={isCollapsed} />
            <div
                className={cx(classes.title, {
                    [classes.withSelection]: selectedCount > 0,
                })}
                data-test="dimension-card-header-title"
            >
                {children}
            </div>
            {selectedCount > 0 && (
                <div
                    className={classes.count}
                    data-test="dimension-card-header-count"
                >
                    {selectedCount}
                </div>
            )}
        </button>
    )
}
