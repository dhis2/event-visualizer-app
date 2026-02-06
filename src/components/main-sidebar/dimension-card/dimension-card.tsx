import cx from 'classnames'
import { useCallback, useEffect, type ReactNode } from 'react'
import { DimensionCardHeader } from './dimension-card-header'
import classes from './styles/dimension-card.module.css'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    addDimensionCardCollapseState,
    isDimensionCardCollapsed,
    removeDimensionCardCollapseState,
    toggleDimensionCardIsCollapsed,
} from '@store/dimensions-selection-slice'
import type { DimensionCardKey } from '@types'

type DimensionCardProps = {
    dimensionCardKey: DimensionCardKey
    title: string
    selectedCount?: number
    children: ReactNode
    withSubSections?: boolean
}

export const DimensionCard = ({
    dimensionCardKey,
    title,
    selectedCount = 0,
    children,
    withSubSections = false,
}: DimensionCardProps) => {
    const dispatch = useAppDispatch()
    const isCollapsed = useAppSelector((state) =>
        isDimensionCardCollapsed(state, dimensionCardKey)
    )

    const handleToggle = useCallback(() => {
        dispatch(toggleDimensionCardIsCollapsed(dimensionCardKey))
    }, [dispatch, dimensionCardKey])

    useEffect(() => {
        dispatch(addDimensionCardCollapseState(dimensionCardKey))
        return () => {
            dispatch(removeDimensionCardCollapseState(dimensionCardKey))
        }
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
                    [classes.withSubSections]: withSubSections,
                })}
                data-test="dimension-card-content"
            >
                {children}
            </div>
        </div>
    )
}
