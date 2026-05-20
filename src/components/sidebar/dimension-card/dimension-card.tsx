import {
    useCardDisabledNoticeText,
    useIsCardDisabledByLayout,
} from '@components/sidebar/sidebar-disabling'
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
import { CardDisabledNotice } from './card-disabled-notice'
import { DimensionCardHeader } from './dimension-card-header'
import classes from './styles/dimension-card.module.css'

/* Lets dim items inside a card learn whether their containing card is
 * disabled, so they can suppress interaction (click, drag, + button)
 * without each per-card component having to thread a flag through
 * DimensionList. Load-more controls are rendered as siblings of the dim
 * items (not via DraggableDimensionItem), so they stay interactive. */
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
    const isDisabledByLayout = useIsCardDisabledByLayout(dimensionCardKey)
    const noticeText = useCardDisabledNoticeText(dimensionCardKey)
    const isVisuallyDisabled = isDisabledByFilter || isDisabledByLayout

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
        <>
            {noticeText && <CardDisabledNotice message={noticeText} />}
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
        </>
    )
}
