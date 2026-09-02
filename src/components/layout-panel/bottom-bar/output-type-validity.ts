import i18n from '@dhis2/d2-i18n'
import { isDataSourceProgramWithoutRegistration } from '@modules/data-source'
import { isDimensionInLayout, resolveLayoutContext } from '@modules/layout'
import {
    selectLayoutAllDimensionIds,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import type {
    MetadataStore,
    OutputType,
    Program,
    VisualizationType,
} from '@types'

/* The output types the bottom bar offers for a visualization type. A pivot
 * table has no tracked entity output; its third button is the custom value
 * variant of EVENT, not an output type of its own. */
export const getAvailableOutputTypes = (
    visualizationType: VisualizationType
): OutputType[] =>
    visualizationType === 'PIVOT_TABLE'
        ? ['ENROLLMENT', 'EVENT']
        : ['TRACKED_ENTITY_INSTANCE', 'ENROLLMENT', 'EVENT']

export type TooltipConfig = { content: string; openDelay?: number } | undefined

const getRegistrationOuTooltipContent = (): TooltipConfig => ({
    content: i18n.t('Not valid with registration org. unit'),
})

type CategoryLayoutState = {
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
}

const getCategoryTooltipContent = ({
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
}: CategoryLayoutState): TooltipConfig => {
    if (hasCategoryInLayout && hasCategoryOptionGroupSetInLayout) {
        return {
            content: i18n.t(
                'Not valid with categories or category option group sets'
            ),
        }
    }
    if (hasCategoryInLayout) {
        return { content: i18n.t('Not valid with categories') }
    }
    if (hasCategoryOptionGroupSetInLayout) {
        return { content: i18n.t('Not valid with category option group sets') }
    }
    return undefined
}

type EventTooltipContentParams = {
    hasNoProgramInLayout: boolean
    hasMultipleProgramsInLayout: boolean
    hasMultipleProgramStagesInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEventTooltipContent = ({
    hasNoProgramInLayout,
    hasMultipleProgramsInLayout,
    hasMultipleProgramStagesInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EventTooltipContentParams): TooltipConfig => {
    if (hasNoProgramInLayout) {
        return { content: i18n.t('Not valid without a program') }
    }

    if (
        hasMultipleProgramsInLayout &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (isRegistrationOuInLayout) {
        return getRegistrationOuTooltipContent()
    }

    if (hasMultipleProgramStagesInLayout) {
        return { content: i18n.t('Not valid with multiple program stages') }
    }

    return undefined
}

type EnrollmentTooltipContentParams = {
    programMetadata: Program | undefined
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultipleProgramsInLayout: boolean
    hasNoProgramInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEnrollmentTooltipContent = ({
    programMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasNoProgramInLayout,
    hasMultipleProgramsInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EnrollmentTooltipContentParams): TooltipConfig => {
    if (hasNoProgramInLayout) {
        return { content: i18n.t('Not valid without a program') }
    }

    if (
        hasMultipleProgramsInLayout &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (isDataSourceProgramWithoutRegistration(programMetadata)) {
        return { content: i18n.t('Not valid with event programs') }
    }

    if (isRegistrationOuInLayout) {
        return getRegistrationOuTooltipContent()
    }

    return getCategoryTooltipContent({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}

type TrackedEntityInstanceTooltipContentParams = {
    programMetadata: Program | undefined
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasCompletedOnInLayout: boolean
    hasMultipleProgramsInLayout: boolean
    hasMultipleTetInLayout: boolean
    hasNoTetInLayout: boolean
    hasProgramIndicatorsInLayout: boolean
    visualizationType: string
}

const getTrackedEntityInstanceTooltipContent = ({
    programMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasCompletedOnInLayout,
    hasMultipleProgramsInLayout,
    hasMultipleTetInLayout,
    hasNoTetInLayout,
    hasProgramIndicatorsInLayout,
    visualizationType,
}: TrackedEntityInstanceTooltipContentParams): TooltipConfig => {
    if (hasCompletedOnInLayout) {
        return {
            content: i18n.t('Not valid with Completed on'),
        }
    }

    if (hasMultipleTetInLayout) {
        return {
            content: i18n.t('Not valid with multiple tracked entity types'),
        }
    }

    if (hasMultipleProgramsInLayout && visualizationType === 'PIVOT_TABLE') {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (isDataSourceProgramWithoutRegistration(programMetadata)) {
        return { content: i18n.t('Not valid with event programs') }
    }

    /* No tracked entity type can be resolved from the layout, so the output
     * cannot be built. Reported after the event-program case, which is the
     * more informative reason when it applies. */
    if (hasNoTetInLayout) {
        return { content: i18n.t('Not valid without a tracked entity type') }
    }

    if (visualizationType === 'LINE_LIST' && hasProgramIndicatorsInLayout) {
        return { content: i18n.t('Not valid with program indicators') }
    }

    return getCategoryTooltipContent({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}
/* Why an output type cannot be produced from this config, or undefined when it
 * can. The single source of truth for output type validity: the buttons
 * disable on it, and the unapplied changes hint uses it to decide whether the
 * config is applicable at all. */
export const getOutputTypeTooltipConfig = ({
    outputType,
    visUiConfig,
    metadataStore,
}: {
    outputType: OutputType
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
}): TooltipConfig => {
    const { layout, visualizationType } = visUiConfig
    const layoutDimensionIds = selectLayoutAllDimensionIds(visUiConfig)

    if (!layoutDimensionIds.length) {
        return {
            content: i18n.t(
                'Nothing selected. Add items to the layout to get started.'
            ),
            openDelay: 1000,
        }
    }

    const { tetId, programIds, programStageIds } = resolveLayoutContext(
        layoutDimensionIds,
        metadataStore
    )

    const dimensionTypeCount = (dimensionType: string): number =>
        layoutDimensionIds.filter(
            (dimensionId) =>
                metadataStore.getDimensionMetadataItem(dimensionId)
                    ?.dimensionType === dimensionType
        ).length

    const tetIdsInLayout = new Set(
        layoutDimensionIds
            .map(
                (dimensionId) =>
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.trackedEntityTypeId
            )
            .filter(Boolean)
    )

    const programMetadata = programIds[0]
        ? metadataStore.getProgramMetadataItem(programIds[0])
        : undefined
    const hasCategoryInLayout = dimensionTypeCount('CATEGORY') > 0
    const hasCategoryOptionGroupSetInLayout =
        dimensionTypeCount('CATEGORY_OPTION_GROUP_SET') > 0
    const hasNoProgramInLayout = programIds.length === 0
    const hasMultipleProgramsInLayout = programIds.length > 1
    const isRegistrationOuInLayout = tetId
        ? isDimensionInLayout(layout, `${tetId}.enrollmentOu`)
        : false

    switch (outputType) {
        case 'EVENT':
            return getEventTooltipContent({
                hasNoProgramInLayout,
                hasMultipleProgramsInLayout,
                hasMultipleProgramStagesInLayout: programStageIds.length > 1,
                isRegistrationOuInLayout,
                visualizationType,
            })
        case 'ENROLLMENT':
            return getEnrollmentTooltipContent({
                programMetadata,
                hasCategoryInLayout,
                hasCategoryOptionGroupSetInLayout,
                hasNoProgramInLayout,
                hasMultipleProgramsInLayout,
                isRegistrationOuInLayout,
                visualizationType,
            })
        case 'TRACKED_ENTITY_INSTANCE':
            return getTrackedEntityInstanceTooltipContent({
                programMetadata,
                hasCategoryInLayout,
                hasCategoryOptionGroupSetInLayout,
                hasCompletedOnInLayout:
                    layoutDimensionIds.includes('completed'),
                hasMultipleProgramsInLayout,
                hasMultipleTetInLayout: tetIdsInLayout.size > 1,
                hasNoTetInLayout: !tetId,
                hasProgramIndicatorsInLayout:
                    dimensionTypeCount('PROGRAM_INDICATOR') > 0,
                visualizationType,
            })
    }
}
