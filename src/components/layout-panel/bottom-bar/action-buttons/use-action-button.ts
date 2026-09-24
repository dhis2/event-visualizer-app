import type { TooltipConfig } from '@components/layout-panel/bottom-bar/with-tooltip'
import i18n from '@dhis2/d2-i18n'
import {
    useAppSelector,
    useCellValueContext,
    useLayoutContext,
    useMetadataStore,
} from '@hooks'
import { isDataSourceProgramWithoutRegistration } from '@modules/data-source'
import { isDimensionInLayout } from '@modules/layout'
import { isVisualizationEmpty } from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import {
    getVisUiConfigLayout,
    getVisUiConfigLayoutAllDimensionIds,
    getVisUiConfigLayoutIsEmpty,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { OutputType, Program } from '@types'
import { useMemo } from 'react'
import type { ButtonAction } from './base-button'

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

    if (visualizationType === 'LINE_LIST' && hasProgramIndicatorsInLayout) {
        return { content: i18n.t('Not valid with program indicators') }
    }

    return getCategoryTooltipConfig({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}

export const useActionButton = (buttonType: OutputType) => {
    const currentVis = useAppSelector(getCurrentVis)
    const { tetId, programStageIds, programIds } = useLayoutContext()
    /* The cell value is not a layout dimension, but it carries the same
     * program/stage/TET context and the output type has to be valid for it
     * too */
    const cellValueContext = useCellValueContext()
    const layout = useAppSelector(getVisUiConfigLayout)
    const layoutDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const isLayoutEmpty = useAppSelector(getVisUiConfigLayoutIsEmpty)
    const metadataStore = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const firstProgramMetadata = useMemo(
        () =>
            programIds[0]
                ? metadataStore.getProgramMetadataItem(programIds[0])
                : undefined,
        [programIds, metadataStore]
    )

    const tetMetadata = useMemo(
        () => (tetId ? metadataStore.getMetadataItem(tetId) : undefined),
        [tetId, metadataStore]
    )

    const action = useMemo((): ButtonAction => {
        // Empty visualization
        if (isVisualizationEmpty(currentVis)) {
            return 'create'
        } else if (outputType === buttonType) {
            return 'update'
        } else {
            return 'switch'
        }
    }, [buttonType, currentVis, outputType])

    const hasCategoryInLayout: boolean = useMemo(
        () =>
            layoutDimensionIds.some(
                (dimensionId) =>
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionType === 'CATEGORY'
            ),
        [layoutDimensionIds, metadataStore]
    )

    const hasCategoryOptionGroupSetInLayout: boolean = useMemo(
        () =>
            layoutDimensionIds.some(
                (dimensionId) =>
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionType === 'CATEGORY_OPTION_GROUP_SET'
            ),
        [layoutDimensionIds, metadataStore]
    )

    const hasCompletedOnInLayout: boolean = useMemo(
        () => layoutDimensionIds.includes('completed'),
        [layoutDimensionIds]
    )

    const selectedProgramCount = useMemo(
        () => new Set([...programIds, ...cellValueContext.programIds]).size,
        [programIds, cellValueContext.programIds]
    )

    const selectedTetCount = useMemo(() => {
        const tetIds = new Set<string>()

        layoutDimensionIds.forEach((dimensionId) => {
            const tetId =
                metadataStore.getDimensionMetadataItem(
                    dimensionId
                )?.trackedEntityTypeId

            if (tetId) {
                tetIds.add(tetId)
            }
        })

        if (cellValueContext.tetId) {
            tetIds.add(cellValueContext.tetId)
        }

        return tetIds.size
    }, [layoutDimensionIds, metadataStore, cellValueContext.tetId])

    /* Layout-only: a cell value on its own is not a layout, so it must not make
     * an empty one look valid. */
    const hasNoProgramInLayout: boolean = programIds.length === 0
    const hasMultipleProgramsSelected: boolean = selectedProgramCount > 1
    const hasMultipleTetSelected: boolean = selectedTetCount > 1

    const hasMultipleProgramStagesSelected: boolean =
        new Set([...programStageIds, ...cellValueContext.programStageIds])
            .size > 1

    const hasProgramIndicatorsInLayout: boolean = useMemo(
        () =>
            layoutDimensionIds.some(
                (dimensionId) =>
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionType === 'PROGRAM_INDICATOR'
            ),
        [layoutDimensionIds, metadataStore]
    )

    const isRegistrationOuInLayout = useMemo(
        () =>
            tetId
                ? isDimensionInLayout(layout, `${tetId}.enrollmentOu`)
                : false,
        [layout, tetId]
    )

    const tooltipConfig = useMemo((): TooltipConfig => {
        if (isLayoutEmpty) {
            return {
                content: i18n.t(
                    'Nothing selected. Add items to the layout to get started.'
                ),
                openDelay: 1000,
            }
        }

        switch (buttonType) {
            case 'EVENT':
                return getEventTooltipConfig({
                    hasNoProgramInLayout,
                    hasMultipleProgramsSelected,
                    hasMultipleProgramStagesSelected,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'ENROLLMENT':
                return getEnrollmentTooltipConfig({
                    programMetadata: firstProgramMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasNoProgramInLayout,
                    hasMultipleProgramsSelected,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'TRACKED_ENTITY_INSTANCE':
                return getTrackedEntityInstanceTooltipConfig({
                    programMetadata: firstProgramMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasCompletedOnInLayout,
                    hasMultipleProgramsSelected,
                    hasMultipleTetSelected,
                    hasProgramIndicatorsInLayout,
                    visualizationType,
                })
        }
    }, [
        buttonType,
        firstProgramMetadata,
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
        hasCompletedOnInLayout,
        hasNoProgramInLayout,
        hasMultipleProgramsSelected,
        hasMultipleProgramStagesSelected,
        hasMultipleTetSelected,
        hasProgramIndicatorsInLayout,
        isLayoutEmpty,
        isRegistrationOuInLayout,
        visualizationType,
    ])

    const dataSourceMetadata =
        buttonType === 'TRACKED_ENTITY_INSTANCE'
            ? tetMetadata
            : firstProgramMetadata

    return {
        action,
        dataSourceMetadata,
        tooltipConfig,
    }
}
