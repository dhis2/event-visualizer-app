import type { TooltipConfig } from '@components/layout-panel/bottom-bar/with-tooltip'
import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useLayoutContext, useMetadataStore } from '@hooks'
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
    hasMultipleProgramsInLayout: boolean
    hasMultipleProgramStagesInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEventTooltipConfig = ({
    hasNoProgramInLayout,
    hasMultipleProgramsInLayout,
    hasMultipleProgramStagesInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EventTooltipConfigParams): TooltipConfig => {
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
        return getRegistrationOuTooltipConfig()
    }

    if (hasMultipleProgramStagesInLayout) {
        return { content: i18n.t('Not valid with multiple program stages') }
    }

    return undefined
}

type EnrollmentTooltipConfigParams = {
    programMetadata: Program | undefined
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultipleProgramsInLayout: boolean
    hasNoProgramInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEnrollmentTooltipConfig = ({
    programMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasNoProgramInLayout,
    hasMultipleProgramsInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EnrollmentTooltipConfigParams): TooltipConfig => {
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
    hasMultipleProgramsInLayout: boolean
    hasMultipleTetInLayout: boolean
    hasProgramIndicatorsInLayout: boolean
    visualizationType: string
}

const getTrackedEntityInstanceTooltipConfig = ({
    programMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasCompletedOnInLayout,
    hasMultipleProgramsInLayout,
    hasMultipleTetInLayout,
    hasProgramIndicatorsInLayout,
    visualizationType,
}: TrackedEntityInstanceTooltipConfigParams): TooltipConfig => {
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

    const programCountInLayout = programIds.length

    const tetCountInLayout = useMemo(() => {
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

        return tetIds.size
    }, [layoutDimensionIds, metadataStore])

    const hasNoProgramInLayout: boolean = programCountInLayout === 0
    const hasMultipleProgramsInLayout: boolean = programCountInLayout > 1
    const hasMultipleTetInLayout: boolean = tetCountInLayout > 1

    const hasMultipleProgramStagesInLayout: boolean = programStageIds.length > 1

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
                    hasMultipleProgramsInLayout,
                    hasMultipleProgramStagesInLayout,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'ENROLLMENT':
                return getEnrollmentTooltipConfig({
                    programMetadata: firstProgramMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasNoProgramInLayout,
                    hasMultipleProgramsInLayout,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'TRACKED_ENTITY_INSTANCE':
                return getTrackedEntityInstanceTooltipConfig({
                    programMetadata: firstProgramMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasCompletedOnInLayout,
                    hasMultipleProgramsInLayout,
                    hasMultipleTetInLayout,
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
        hasMultipleProgramsInLayout,
        hasMultipleProgramStagesInLayout,
        hasMultipleTetInLayout,
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
