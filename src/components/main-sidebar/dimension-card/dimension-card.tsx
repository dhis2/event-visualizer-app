import cx from 'classnames'
import { useCallback, type ReactNode } from 'react'
import { DimensionCardHeader } from './dimension-card-header'
import classes from './styles/dimension-card.module.css'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    isDimensionCardCollapsed,
    toggleDimensionCardIsCollapsed,
} from '@store/dimensions-selection-slice'
import type { DimensionCardKey } from '@types'

type DimensionCardProps = {
    dimensionCardKey: DimensionCardKey
    title: string
    selectedCount?: number
    children: ReactNode
}

export const DimensionCard = ({
    dimensionCardKey,
    title,
    selectedCount = 0,
    children,
}: DimensionCardProps) => {
    const dispatch = useAppDispatch()
    const isCollapsed = useAppSelector((state) =>
        isDimensionCardCollapsed(state, dimensionCardKey)
    )

    const handleToggle = useCallback(() => {
        dispatch(toggleDimensionCardIsCollapsed(dimensionCardKey))
    }, [dispatch, dimensionCardKey])

    return (
        <div
            className={classes.container}
            data-test="dimension-card"
            tabIndex={0}
        >
            <DimensionCardHeader
                selectedCount={selectedCount}
                isCollapsed={isCollapsed}
                onToggle={handleToggle}
            >
                {title}
            </DimensionCardHeader>

            <div
                className={cx(classes.content, {
                    [classes.collapsed]: isCollapsed,
                })}
                data-test="dimension-card-content"
            >
                {children}
            </div>
        </div>
    )
}
