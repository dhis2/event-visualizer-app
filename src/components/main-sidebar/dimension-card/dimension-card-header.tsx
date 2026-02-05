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
    return (
        <div
            className={classes.header}
            onClick={onToggle}
            data-test="dimension-card-header"
        >
            <div
                className={classes.icon}
                data-test="dimension-card-header-icon"
            >
                <CollapseIcon isCollapsed={isCollapsed} />
            </div>
            <div
                className={cx(classes.label, {
                    [classes.withSelection]: selectedCount > 0,
                })}
                data-test="dimension-card-header-label"
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
