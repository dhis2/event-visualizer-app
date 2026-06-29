import { useSyncAutoCollapse } from '@components/sidebar/sidebar-disabling'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    addDimensionCardCollapsedState,
    isDimensionCardCollapsed,
    removeDimensionCardCollapsedState,
    toggleDimensionCardIsCollapsed,
} from '@store/dimensions-selection-slice'
import type { DimensionCardKey } from '@types'
import cx from 'classnames'
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    type ReactNode,
    type FC,
} from 'react'
import { DimensionCardHeader } from './dimension-card-header'
import classes from './styles/dimension-card.module.css'

/* Descendants are passed in as `children`, so they can't receive the
 * disabled state via props — they read it through this context. */
const ContainingCardDisabledContext = createContext<boolean>(false)

export const useIsContainingCardDisabled = (): boolean =>
    useContext(ContainingCardDisabledContext)

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
}) => {
    const dispatch = useAppDispatch()
    const isCollapsed = useAppSelector((state) =>
        isDimensionCardCollapsed(state, dimensionCardKey)
    )
    const isVisuallyDisabled = isDisabledByFilter

    const handleToggle = useCallback(() => {
        dispatch(toggleDimensionCardIsCollapsed(dimensionCardKey))
    }, [dispatch, dimensionCardKey])

    useEffect(() => {
        dispatch(addDimensionCardCollapsedState(dimensionCardKey))
        return () => {
            dispatch(removeDimensionCardCollapsedState(dimensionCardKey))
        }
    }, [dispatch, dimensionCardKey])

    /* Declared after the register effect above so that, on mount, the card is
     * registered before this syncs its auto-collapsed state. */
    useSyncAutoCollapse(dimensionCardKey)

    return (
        <div
            className={cx(classes.container, {
                [classes.isDisabled]: isVisuallyDisabled,
            })}
            data-test="dimension-card"
        >
            <DimensionCardHeader
                selectedCount={selectedCount}
                isCollapsed={isCollapsed}
                onToggle={handleToggle}
                isDisabled={isVisuallyDisabled}
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
                <ContainingCardDisabledContext.Provider
                    value={isVisuallyDisabled}
                >
                    {children}
                </ContainingCardDisabledContext.Provider>
            </div>
        </div>
    )
}
