import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    useAppDispatch,
    useAppSelector,
    useMetadataItem,
    useMetadataStore,
    useTetId,
} from '@hooks'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import { resolveDimensionTetId, resolveTetId } from '@modules/layout'
import {
    isDimensionCrossTet,
    isDimensionFullyInvalidForVisType,
} from '@modules/validation'
import {
    getDataSourceId,
    setDimensionCardCollapsed,
} from '@store/dimensions-selection-slice'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigLayoutAllDimensionIds,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type {
    DimensionCardKey,
    DimensionMetadataItem,
    MetadataItem,
    MetadataStore,
    RootState,
    VisualizationType,
} from '@types'
import { useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Cross tracked-entity-type detection
// ─────────────────────────────────────────────────────────────────────────────

/* Dimensions from different tracked entity types cannot coexist in one layout.
 * When the current data source's TET differs from the TET already established
 * by the layout, that data source's program/TET dimensions are blocked at the
 * item level (see getDimensionLayoutBlockedMessage) and their cards collapse. */

type CrossTetMismatch = {
    dataSourceTetName: string
    layoutTetName: string
    layoutTetId: string
}

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

const getDataSourceTet = (
    dataSource: MetadataItem | undefined
): { id: string; name: string } | null => {
    if (isDataSourceProgramWithRegistration(dataSource)) {
        return {
            id: dataSource.trackedEntityType.id,
            name: dataSource.trackedEntityType.name,
        }
    }
    if (isDataSourceTrackedEntityType(dataSource)) {
        return { id: dataSource.id, name: dataSource.name }
    }
    return null
}

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

export const getCrossTetMessage = (
    dataSourceTetName: string,
    layoutTetName: string
): string =>
    i18n.t(
        '{{- dataSourceTetName}} dimensions cannot be combined with {{- layoutTetName}} dimensions already in the layout.',
        { dataSourceTetName, layoutTetName }
    )

/* State-based resolver for non-hook call sites (e.g. the drag-end callback).
 * Returns the TET names + layout TET id when the current data source's TET
 * differs from the layout's TET, else null. */
export const resolveCrossTetMismatch = (
    state: RootState,
    metadataStore: MetadataStore
): CrossTetMismatch | null => {
    const dataSourceId = getDataSourceId(state)
    const dataSourceTet = dataSourceId
        ? getDataSourceTet(metadataStore.getMetadataItem(dataSourceId))
        : null
    if (!dataSourceTet) {
        return null
    }
    const layoutTetId = resolveTetId(
        getVisUiConfigLayoutAllDimensionIds(state),
        metadataStore
    )
    if (!layoutTetId || layoutTetId === dataSourceTet.id) {
        return null
    }
    return {
        dataSourceTetName: dataSourceTet.name,
        layoutTetName: metadataStore.getMetadataItem(layoutTetId)?.name ?? '',
        layoutTetId,
    }
}

export const useCrossTetMismatch = (): CrossTetMismatch | null => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSource = useMetadataItem(dataSourceId)
    const dataSourceTet = getDataSourceTet(dataSource)
    const layoutTetId = useTetId()
    const layoutTet = useMetadataItem(layoutTetId)
    if (!dataSourceTet || !layoutTet || dataSourceTet.id === layoutTet.id) {
        return null
    }
    return {
        dataSourceTetName: dataSourceTet.name,
        layoutTetName: layoutTet.name,
        layoutTetId: layoutTet.id,
    }
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

// ─────────────────────────────────────────────────────────────────────────────
// Dimension-level layout-blocked messages
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionBlockReason = 'customValue' | 'visType' | 'crossTet'

type DimensionBlockReasonInput = {
    dimension: DimensionMetadataItem
    visualizationType: VisualizationType
    customValueId: string | null
    layoutTetId: string | null
    dimensionTetId: string | null
}

/* Single source of truth for whether — and why — a dimension is blocked from
 * the layout, in precedence order. Both the item-level message and the
 * batch-add grouping derive from this. */
export const getDimensionBlockReason = ({
    dimension,
    visualizationType,
    customValueId,
    layoutTetId,
    dimensionTetId,
}: DimensionBlockReasonInput): DimensionBlockReason | null => {
    if (customValueId && dimension.id === customValueId) {
        return 'customValue'
    }
    if (isDimensionFullyInvalidForVisType(dimension, visualizationType)) {
        return 'visType'
    }
    if (isDimensionCrossTet(dimensionTetId, layoutTetId)) {
        return 'crossTet'
    }
    return null
}

type DimensionDisablingInput = DimensionBlockReasonInput & {
    crossTetMessage: string
}

export const getDimensionLayoutBlockedMessage = (
    input: DimensionDisablingInput
): string | null => {
    switch (getDimensionBlockReason(input)) {
        case 'customValue':
            return i18n.t('Already used as custom value.')
        case 'visType':
            return i18n.t('Cannot be used in a {{visType}}.', {
                visType: visTypeDisplayNames[input.visualizationType],
            })
        case 'crossTet':
            return input.crossTetMessage
        default:
            return null
    }
}

export const useDimensionLayoutBlockedMessage = (
    dimension: DimensionMetadataItem | undefined
): string | null => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const metadataStore = useMetadataStore()
    const layoutTetId = useTetId()
    const mismatch = useCrossTetMismatch()
    if (!dimension) {
        return null
    }
    return getDimensionLayoutBlockedMessage({
        dimension,
        visualizationType,
        customValueId: customValue?.id ?? null,
        layoutTetId,
        dimensionTetId: resolveDimensionTetId(dimension, metadataStore),
        crossTetMessage: mismatch
            ? getCrossTetMessage(
                  mismatch.dataSourceTetName,
                  mismatch.layoutTetName
              )
            : '',
    })
}
