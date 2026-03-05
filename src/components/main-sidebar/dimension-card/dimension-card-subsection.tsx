import cx from 'classnames'
import { type FC, useCallback, useState, type ReactNode } from 'react'
import { CollapseIcon } from './collapse-icon'
import classes from './styles/dimension-card-subsection.module.css'

type DimensionsCardSubsectionProps = {
    title: string
    children: ReactNode
    selectedCount?: number
    isDisabled?: boolean
}

export const DimensionsCardSubsection: FC<DimensionsCardSubsectionProps> = ({
    title,
    children,
    selectedCount = 0,
    isDisabled = false,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const handleToggle = useCallback(() => {
        setIsCollapsed((prev) => !prev)
    }, [])

    return (
        <div
            className={classes.container}
            data-test="dimension-card-subsection"
        >
            <button
                type="button"
                className={classes.header}
                onClick={handleToggle}
                aria-expanded={!isCollapsed}
                disabled={isDisabled}
                tabIndex={isDisabled ? -1 : 0}
                data-test="dimension-card-subsection-header"
            >
                {<CollapseIcon isCollapsed={isCollapsed} />}
                <div
                    className={cx(classes.title, {
                        [classes.withSelection]: selectedCount > 0,
                    })}
                    data-test="dimension-card-subsection-title"
                >
                    {title}
                </div>
                {selectedCount > 0 && (
                    <div
                        className={classes.count}
                        data-test="dimension-card-subsection-count"
                    >
                        {selectedCount}
                    </div>
                )}
            </button>
            <div
                className={cx(classes.content, {
                    [classes.collapsed]: isCollapsed,
                })}
                data-test="dimension-card-subsection-content"
            >
                {children}
            </div>
        </div>
    )
}
