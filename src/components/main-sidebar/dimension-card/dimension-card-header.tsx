import cx from 'classnames'
import type { ReactNode } from 'react'
import { CollapseIcon } from './collapse-icon'
import classes from './styles/dimension-card-header.module.css'

type DimensionCardHeaderProps = {
    children: ReactNode
    selectedCount: number
    isCollapsed: boolean
    onToggle: () => void
}

export const DimensionCardHeader = ({
    children,
    selectedCount,
    isCollapsed,
    onToggle,
}: DimensionCardHeaderProps) => {
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
        }
    }

    return (
        <div
            className={classes.container}
            onClick={onToggle}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={!isCollapsed}
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
        </div>
    )
}
