import i18n from '@dhis2/d2-i18n'
import { isDataSourceProgramWithoutRegistration } from '@modules/data-source'
import {
    isDimensionInLayout,
    resolveCellValueContext,
    resolveLayoutContext,
} from '@modules/layout'
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
 * table has no tracked entity output. */
export const getAvailableOutputTypes = (
    visualizationType: VisualizationType
): OutputType[] =>
    visualizationType === 'PIVOT_TABLE'
        ? ['ENROLLMENT', 'EVENT']
        : ['TRACKED_ENTITY_INSTANCE', 'ENROLLMENT', 'EVENT']

export type TooltipConfig = { content: string; openDelay?: number } | undefined

const getRegistrationOuTooltipConfig = (): TooltipConfig => ({
    content: i18n.t('Not valid with registration org. unit'),
})

type CategoryLayoutState = {
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
}

const getCategoryTooltipConfig = ({
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

type EventTooltipConfigParams = {
    hasNoProgramInLayout: boolean
    hasMultipleProgramsSelected: boolean
    hasMultipleProgramStagesSelected: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEventTooltipConfig = ({
    hasNoProgramInLayout,
    hasMultipleProgramsSelected,
    hasMultipleProgramStagesSelected,
    isRegistrationOuInLayout,
    visualizationType,
}: EventTooltipConfigParams): TooltipConfig => {
    if (hasNoProgramInLayout) {
        return { content: i18n.t('Not valid without a program') }
    }

    if (
        hasMultipleProgramsSelected &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (isRegistrationOuInLayout) {
        return getRegistrationOuTooltipConfig()
    }

    if (hasMultipleProgramStagesSelected) {
        return { content: i18n.t('Not valid with multiple program stages') }
    }

    return undefined
}

type EnrollmentTooltipConfigParams = {
    programMetadata: Program | undefined
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultipleProgramsSelected: boolean
    hasNoProgramInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEnrollmentTooltipConfig = ({
    programMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasNoProgramInLayout,
    hasMultipleProgramsSelected,
    isRegistrationOuInLayout,
    visualizationType,
}: EnrollmentTooltipConfigParams): TooltipConfig => {
    if (hasNoProgramInLayout) {
        return { content: i18n.t('Not valid without a program') }
    }

    if (
        hasMultipleProgramsSelected &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (isDataSourceProgramWithoutRegistration(programMetadata)) {
        return { content: i18n.t('Not valid with event programs') }
    }

    if (isRegistrationOuInLayout) {
        return getRegistrationOuTooltipConfig()
    }

    return getCategoryTooltipConfig({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}

type TrackedEntityInstanceTooltipConfigParams = {
    programMetadata: Program | undefined
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasCompletedOnInLayout: boolean
    hasMultipleProgramsSelected: boolean
    hasMultipleTetSelected: boolean
    hasNoTetInLayout: boolean
    hasProgramIndicatorsInLayout: boolean
    visualizationType: string
}

const getTrackedEntityInstanceTooltipConfig = ({
    programMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasCompletedOnInLayout,
    hasMultipleProgramsSelected,
    hasMultipleTetSelected,
    hasNoTetInLayout,
    hasProgramIndicatorsInLayout,
    visualizationType,
}: TrackedEntityInstanceTooltipConfigParams): TooltipConfig => {
    if (hasCompletedOnInLayout) {
        return {
            content: i18n.t('Not valid with Completed on'),
        }
    }

    if (hasMultipleTetSelected) {
        return {
            content: i18n.t('Not valid with multiple tracked entity types'),
        }
    }

    if (hasMultipleProgramsSelected && visualizationType === 'PIVOT_TABLE') {
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

    return getCategoryTooltipConfig({
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

    /* The cell value is not a layout dimension, but it carries the same
     * program/stage/TET context and the output type has to be valid for it too
     * — a cell value from another program is what the "multiple programs" rule
     * is there to catch. Only a pivot table has one: in a line list it is
     * neither shown nor sent, so it must not make an output type look invalid
     * for a reason nothing on screen explains. */
    const cellValueContext = resolveCellValueContext(
        visualizationType === 'PIVOT_TABLE'
            ? visUiConfig.cellValue?.id
            : undefined,
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
    /* Layout-only: a cell value on its own is not a layout, so it must not make
     * an empty one look valid. */
    const hasNoProgramInLayout = programIds.length === 0
    const hasMultipleProgramsSelected =
        new Set([...programIds, ...cellValueContext.programIds]).size > 1
    const isRegistrationOuInLayout = tetId
        ? isDimensionInLayout(layout, `${tetId}.enrollmentOu`)
        : false

    switch (outputType) {
        case 'EVENT':
            return getEventTooltipConfig({
                hasNoProgramInLayout,
                hasMultipleProgramsSelected,
                hasMultipleProgramStagesSelected:
                    new Set([
                        ...programStageIds,
                        ...cellValueContext.programStageIds,
                    ]).size > 1,
                isRegistrationOuInLayout,
                visualizationType,
            })
        case 'ENROLLMENT':
            return getEnrollmentTooltipConfig({
                programMetadata,
                hasCategoryInLayout,
                hasCategoryOptionGroupSetInLayout,
                hasNoProgramInLayout,
                hasMultipleProgramsSelected,
                isRegistrationOuInLayout,
                visualizationType,
            })
        case 'TRACKED_ENTITY_INSTANCE':
            return getTrackedEntityInstanceTooltipConfig({
                programMetadata,
                hasCategoryInLayout,
                hasCategoryOptionGroupSetInLayout,
                hasCompletedOnInLayout:
                    layoutDimensionIds.includes('completed'),
                hasMultipleProgramsSelected,
                hasMultipleTetSelected:
                    new Set(
                        [...tetIdsInLayout, cellValueContext.tetId].filter(
                            Boolean
                        )
                    ).size > 1,
                hasNoTetInLayout: !tetId,
                hasProgramIndicatorsInLayout:
                    dimensionTypeCount('PROGRAM_INDICATOR') > 0,
                visualizationType,
            })
    }
}
