import cx from 'classnames'
import { useCallback, useEffect, type ReactNode, type FC } from 'react'
import { DimensionCardHeader } from './dimension-card-header'
import classes from './styles/dimension-card.module.css'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    addDimensionCardCollapsedState,
    isDimensionCardCollapsed,
    removeDimensionCardCollapsedState,
    toggleDimensionCardIsCollapsed,
} from '@store/dimensions-selection-slice'
import type { DimensionCardKey } from '@types'

type DimensionCardProps = {
    dimensionCardKey: DimensionCardKey
    title: string
    selectedCount?: number
    children: ReactNode
    withSubSections?: boolean
    isDisabledByFilter?: boolean
}

export const DimensionCard: FC<DimensionCardProps> = ({
    dimensionCardKey,
    title,
    selectedCount = 0,
    children,
    withSubSections = false,
    isDisabledByFilter = false,
}: DimensionCardProps) => {
    const dispatch = useAppDispatch()
    const isCollapsed = useAppSelector((state) =>
        isDimensionCardCollapsed(state, dimensionCardKey)
    )

    const handleToggle = useCallback(() => {
        dispatch(toggleDimensionCardIsCollapsed(dimensionCardKey))
    }, [dispatch, dimensionCardKey])

    useEffect(() => {
        dispatch(addDimensionCardCollapsedState(dimensionCardKey))
        return () => {
            dispatch(removeDimensionCardCollapsedState(dimensionCardKey))
        }
    }, [dispatch, dimensionCardKey])

    return (
        <div
            className={cx(classes.container, {
                [classes.isDisabledByFilter]: isDisabledByFilter,
            })}
            data-test="dimension-card"
        >
            <DimensionCardHeader
                selectedCount={selectedCount}
                isCollapsed={isCollapsed}
                onToggle={handleToggle}
                isDisabled={isDisabledByFilter}
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
