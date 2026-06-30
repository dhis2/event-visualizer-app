import {
    useAppDispatch,
    useAppSelector,
    useCrossTetMismatch,
    useMetadataItem,
} from '@hooks'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import {
    getDataSourceId,
    setDimensionCardCollapsed,
} from '@store/dimensions-selection-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { DimensionCardKey, MetadataItem } from '@types'
import { useEffect } from 'react'

/* Auto-collapse of sidebar cards whose dimensions can't currently be used:
 * a cross-TET conflict (the data source's TET differs from the layout's)
 * collapses the affected program/TET cards, and program-indicator cards
 * collapse outside line list. The dimensions are also blocked at the item
 * level (see getDimensionLayoutBlockedMessage in modules/dimension). */

const EMPTY_CROSS_TET_CARDS: ReadonlySet<DimensionCardKey> = Object.freeze(
    new Set<DimensionCardKey>()
)
const PROGRAM_WITH_REGISTRATION_CROSS_TET_CARDS: ReadonlySet<DimensionCardKey> =
    Object.freeze(
        new Set<DimensionCardKey>([
            'program-tracked-entity-type',
            'enrollment',
            'event-with-registration',
            'enrollment-program-indicators',
        ])
    )
const TRACKED_ENTITY_TYPE_CROSS_TET_CARDS: ReadonlySet<DimensionCardKey> =
    Object.freeze(new Set<DimensionCardKey>(['tracked-entity-type']))

/* Program-indicator cards are only usable in LINE_LIST; outside it they
 * auto-collapse (their items are also blocked at the item level). */
const PROGRAM_INDICATOR_CARDS: ReadonlySet<DimensionCardKey> = Object.freeze(
    new Set<DimensionCardKey>([
        'enrollment-program-indicators',
        'event-program-indicators',
    ])
)

const getCrossTetAffectedCards = (
    dataSource: MetadataItem | undefined
): ReadonlySet<DimensionCardKey> => {
    if (isDataSourceProgramWithRegistration(dataSource)) {
        return PROGRAM_WITH_REGISTRATION_CROSS_TET_CARDS
    }
    if (isDataSourceTrackedEntityType(dataSource)) {
        return TRACKED_ENTITY_TYPE_CROSS_TET_CARDS
    }
    return EMPTY_CROSS_TET_CARDS
}

export const useIsCardCrossTetBlocked = (cardId: DimensionCardKey): boolean => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSource = useMetadataItem(dataSourceId)
    const mismatch = useCrossTetMismatch()
    return !!mismatch && getCrossTetAffectedCards(dataSource).has(cardId)
}

const useIsCardCollapsedByVisType = (cardId: DimensionCardKey): boolean => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    return (
        PROGRAM_INDICATOR_CARDS.has(cardId) && visualizationType !== 'LINE_LIST'
    )
}

const useShouldAutoCollapseCard = (cardId: DimensionCardKey): boolean => {
    const isCrossTetBlocked = useIsCardCrossTetBlocked(cardId)
    const isCollapsedByVisType = useIsCardCollapsedByVisType(cardId)
    return isCrossTetBlocked || isCollapsedByVisType
}

/* Syncs a card's collapsed state to whether it is auto-collapsible: collapses
 * when a reason (cross-TET conflict, or program indicators outside line list)
 * becomes active, and re-expands when all reasons clear. The effect only runs
 * on those transitions, so a manual toggle in between is left untouched. */
export const useSyncAutoCollapse = (cardId: DimensionCardKey): void => {
    const dispatch = useAppDispatch()
    const shouldAutoCollapse = useShouldAutoCollapseCard(cardId)
    useEffect(() => {
        dispatch(
            setDimensionCardCollapsed({
                cardKey: cardId,
                collapsed: shouldAutoCollapse,
            })
        )
    }, [shouldAutoCollapse, cardId, dispatch])
}
