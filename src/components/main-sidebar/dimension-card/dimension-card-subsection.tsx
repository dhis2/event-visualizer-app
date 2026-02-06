import cx from 'classnames'
import { useCallback, useState, type ReactNode } from 'react'
import { CollapseIcon } from './collapse-icon'
import { DimensionList } from './dimension-list'
import classes from './styles/dimension-card-subsection.module.css'

type DimensionsCardSubsectionProps = {
    title: string
    children: ReactNode
    selectedCount?: number
}

export const DimensionsCardSubsection = ({
    title,
    children,
    selectedCount = 0,
}: DimensionsCardSubsectionProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const handleToggle = useCallback(() => {
        setIsCollapsed((prev) => !prev)
    }, [])

    return (
        <div
            className={classes.container}
            data-test="dimension-card-subsection"
        >
            <div
                className={classes.header}
                onClick={handleToggle}
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
            </div>
            <div
                className={cx(classes.content, {
                    [classes.collapsed]: isCollapsed,
                })}
                data-test="dimension-card-subsection-content"
            >
                <DimensionList>{children}</DimensionList>
            </div>
        </div>
    )
}
