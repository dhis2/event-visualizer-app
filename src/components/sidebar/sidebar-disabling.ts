import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useMetadataItem, useTetId } from '@hooks'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceProgramWithoutRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import { isDimensionFullyInvalidForVisType } from '@modules/validation'
import { createSelector } from '@reduxjs/toolkit'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type {
    DataSource,
    DimensionCardKey,
    DimensionMetadataItem,
    MetadataItem,
    RootState,
    VisualizationType,
} from '@types'

// ─────────────────────────────────────────────────────────────────────────────
// Card-level disabling
// ─────────────────────────────────────────────────────────────────────────────

type SidebarDisablingState = {
    disabledCards: Set<DimensionCardKey>
    disabledMessage?: { cardKey: DimensionCardKey; text: string }
}

const EMPTY_SIDEBAR_DISABLING_STATE: SidebarDisablingState = Object.freeze({
    disabledCards: new Set<DimensionCardKey>(),
    disabledMessage: undefined,
})

const differentTetMessage = (tetName: string): string =>
    i18n.t(
        'These dimensions belong to a different tracked entity type than the one used in the layout ({{- tetName}}). Remove the existing dimensions to use these.',
        { tetName }
    )

/* The three data-source branches below directly express which cards a
 * particular data source's invalid-layout states disable and which card
 * carries the explanatory notice. Each branch returns the complete
 * SidebarDisablingState for that data source — no per-card iteration, no
 * cross-card dedup pass. */

const stateForProgramWithRegistration = ({
    dataSourceTetId,
    layoutTet,
}: {
    dataSourceTetId: string
    layoutTet: MetadataItem | null
}): SidebarDisablingState => {
    if (layoutTet && layoutTet.id !== dataSourceTetId) {
        return {
            disabledCards: new Set([
                'enrollment',
                'event-with-registration',
                'program-tracked-entity-type',
                'enrollment-program-indicators',
            ]),
            disabledMessage: {
                cardKey: 'enrollment',
                text: differentTetMessage(layoutTet.name),
            },
        }
    }
    return EMPTY_SIDEBAR_DISABLING_STATE
}

const stateForProgramWithoutRegistration = (): SidebarDisablingState =>
    EMPTY_SIDEBAR_DISABLING_STATE

const stateForTrackedEntityType = ({
    dataSourceTetId,
    layoutTet,
}: {
    dataSourceTetId: string
    layoutTet: MetadataItem | null
}): SidebarDisablingState => {
    /* The standalone Registration card itself stays usable in pivot mode —
     * the registration OU is handled at the item level. The only card-level
     * disable is when the layout already targets a different TET. */
    if (layoutTet && layoutTet.id !== dataSourceTetId) {
        return {
            disabledCards: new Set(['tracked-entity-type']),
            disabledMessage: {
                cardKey: 'tracked-entity-type',
                text: differentTetMessage(layoutTet.name),
            },
        }
    }
    return EMPTY_SIDEBAR_DISABLING_STATE
}

const selectDataSourceArg = (
    _state: RootState,
    dataSource: DataSource | null
): DataSource | null => dataSource

const selectLayoutTetArg = (
    _state: RootState,
    _dataSource: DataSource | null,
    layoutTet: MetadataItem | null
): MetadataItem | null => layoutTet

export const selectSidebarDisablingState = createSelector(
    [getVisUiConfigVisualizationType, selectDataSourceArg, selectLayoutTetArg],
    (_visualizationType, dataSource, layoutTet): SidebarDisablingState => {
        if (!dataSource) {
            return EMPTY_SIDEBAR_DISABLING_STATE
        }
        if (isDataSourceProgramWithRegistration(dataSource)) {
            return stateForProgramWithRegistration({
                dataSourceTetId: dataSource.trackedEntityType.id,
                layoutTet,
            })
        }
        if (isDataSourceProgramWithoutRegistration(dataSource)) {
            return stateForProgramWithoutRegistration()
        }
        if (isDataSourceTrackedEntityType(dataSource)) {
            return stateForTrackedEntityType({
                dataSourceTetId: dataSource.id,
                layoutTet,
            })
        }
        return EMPTY_SIDEBAR_DISABLING_STATE
    }
)

const useSidebarDisablingState = (): SidebarDisablingState => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSource = useMetadataItem(dataSourceId) as DataSource | undefined
    const layoutTetId = useTetId()
    const layoutTet = useMetadataItem(layoutTetId)
    if (layoutTetId && !layoutTet) {
        throw new Error(`Could not find TET with ID "${layoutTetId}"`)
    }
    return useAppSelector((state) =>
        selectSidebarDisablingState(
            state,
            dataSource ?? null,
            layoutTet ?? null
        )
    )
}

export const useIsCardDisabledByLayout = (
    cardId: DimensionCardKey
): boolean => {
    const { disabledCards } = useSidebarDisablingState()
    return disabledCards.has(cardId)
}

export const useCardDisabledNoticeText = (
    cardId: DimensionCardKey
): string | undefined => {
    const { disabledMessage } = useSidebarDisablingState()
    return disabledMessage?.cardKey === cardId
        ? disabledMessage.text
        : undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Dimension-level layout-blocked messages
// ─────────────────────────────────────────────────────────────────────────────

type DimensionDisablingInput = {
    dimension: DimensionMetadataItem
    visualizationType: VisualizationType
    customValueId: string | null
}

const getCustomValueDimensionMessage = ({
    dimension,
    customValueId,
}: DimensionDisablingInput): string | null => {
    if (!customValueId || dimension.id !== customValueId) {
        return null
    }
    return i18n.t('Already used as custom value.')
}

const getInvalidForVisTypeMessage = ({
    dimension,
    visualizationType,
}: DimensionDisablingInput): string | null => {
    if (!isDimensionFullyInvalidForVisType(dimension, visualizationType)) {
        return null
    }
    const visType = visTypeDisplayNames[visualizationType]
    /* Case A (Program Indicator) and Case B (registration OU) are both caught
     * by isDimensionFullyInvalidForVisType, but carry different messages per
     * the spec. */
    if (dimension.dimensionType === 'PROGRAM_INDICATOR') {
        return i18n.t('Cannot be used in a {{visType}}.', { visType })
    }
    return i18n.t('Not supported in a {{visType}}.', { visType })
}

/* Layout-blocked rules. The two reasons are orthogonal (a dim is either
 * the custom-value target or it is invalid for the current vis type, never
 * both), so order does not matter operationally — custom-value is checked
 * first because it is the most common reason in practice. */
export const getDimensionLayoutBlockedMessage = (
    input: DimensionDisablingInput
): string | null =>
    getCustomValueDimensionMessage(input) ?? getInvalidForVisTypeMessage(input)

export const useDimensionLayoutBlockedMessage = (
    dimension: DimensionMetadataItem | undefined
): string | null => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    if (!dimension) {
        return null
    }
    return getDimensionLayoutBlockedMessage({
        dimension,
        visualizationType,
        customValueId: customValue?.id ?? null,
    })
}
