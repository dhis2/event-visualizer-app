import i18n from '@dhis2/d2-i18n'
import { useAppSelector, useMetadataItem, useMetadataStore } from '@hooks'
import {
    isDataSourceProgramWithoutRegistration,
    isDataSourceProgramWithRegistration,
} from '@modules/data-source'
import { isDimensionInLayout } from '@modules/layout'
import { isVisualizationEmpty } from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import {
    getVisUiConfigLastActiveButton,
    getVisUiConfigLayout,
    getVisUiConfigLayoutAllDimensionIds,
    getVisUiConfigLayoutIsEmpty,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { LastActiveButton } from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'
import { useMemo } from 'react'
import type { ButtonAction } from './base-button'

type TooltipContent = { content: string; openDelay?: number } | undefined

type RegistrationLayoutState = {
    isRegistrationDateInLayout: boolean
    isRegistrationOuInLayout: boolean
}

const getRegistrationTooltipContent = ({
    isRegistrationDateInLayout,
    isRegistrationOuInLayout,
}: RegistrationLayoutState): TooltipContent => {
    if (isRegistrationDateInLayout && isRegistrationOuInLayout) {
        return {
            content: i18n.t(
                'Not valid with registration date or registration org. unit'
            ),
        }
    }
    if (isRegistrationDateInLayout) {
        return { content: i18n.t('Not valid with registration date') }
    }
    if (isRegistrationOuInLayout) {
        return { content: i18n.t('Not valid with registration org. unit') }
    }
    return undefined
}

type CategoryLayoutState = {
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
}

const getCategoryTooltipContent = ({
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
}: CategoryLayoutState): TooltipContent => {
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
    buttonVariant: LastActiveButton | undefined
    hasMultipleProgramsInLayout: boolean
    hasMultipleProgramStagesInLayout: boolean
    isRegistrationDateInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEventTooltipContent = ({
    buttonVariant,
    hasNoProgramInLayout,
    hasMultipleProgramsInLayout,
    hasMultipleProgramStagesInLayout,
    isRegistrationDateInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EventTooltipContentParams): TooltipContent => {
    if (
        buttonVariant === 'CUSTOM_VALUE' &&
        hasNoProgramInLayout &&
        visualizationType === 'PIVOT_TABLE'
    ) {
        return { content: i18n.t('Not valid without a program') }
    }
    if (
        hasMultipleProgramsInLayout &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }
    if (isRegistrationDateInLayout || isRegistrationOuInLayout) {
        return getRegistrationTooltipContent({
            isRegistrationDateInLayout,
            isRegistrationOuInLayout,
        })
    }
    if (hasMultipleProgramStagesInLayout) {
        return { content: i18n.t('Not valid with multiple program stages') }
    }
    return undefined
}

type EnrollmentTooltipContentParams = {
    dataSourceMetadata: ReturnType<typeof useMetadataItem>
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultipleProgramsInLayout: boolean
    isRegistrationDateInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEnrollmentTooltipContent = ({
    dataSourceMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasMultipleProgramsInLayout,
    isRegistrationDateInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EnrollmentTooltipContentParams): TooltipContent => {
    if (
        hasMultipleProgramsInLayout &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }
    if (isDataSourceProgramWithoutRegistration(dataSourceMetadata)) {
        return { content: i18n.t('Not valid with event programs') }
    }
    if (isRegistrationDateInLayout || isRegistrationOuInLayout) {
        return getRegistrationTooltipContent({
            isRegistrationDateInLayout,
            isRegistrationOuInLayout,
        })
    }
    return getCategoryTooltipContent({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}

type TrackedEntityInstanceTooltipContentParams = {
    dataSourceMetadata: ReturnType<typeof useMetadataItem>
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultipleProgramsInLayout: boolean
    hasProgramIndicatorsInLayout: boolean
    visualizationType: string
}

const getTrackedEntityInstanceTooltipContent = ({
    dataSourceMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasMultipleProgramsInLayout,
    hasProgramIndicatorsInLayout,
    visualizationType,
}: TrackedEntityInstanceTooltipContentParams): TooltipContent => {
    if (hasMultipleProgramsInLayout && visualizationType === 'PIVOT_TABLE') {
        return { content: i18n.t('Not valid with multiple programs') }
    }
    if (isDataSourceProgramWithoutRegistration(dataSourceMetadata)) {
        return { content: i18n.t('Not valid with event programs') }
    }
    if (visualizationType === 'LINE_LIST' && hasProgramIndicatorsInLayout) {
        return { content: i18n.t('Not valid with program indicators') }
    }
    return getCategoryTooltipContent({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}

export const useActionButton = (
    buttonType: OutputType,
    buttonVariant?: LastActiveButton
) => {
    const currentVis = useAppSelector(getCurrentVis)
    const dataSourceId = useAppSelector(getDataSourceId)
    const lastActiveButton = useAppSelector(getVisUiConfigLastActiveButton)
    const layout = useAppSelector(getVisUiConfigLayout)
    const layoutDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const isLayoutEmpty = useAppSelector(getVisUiConfigLayoutIsEmpty)
    const metadataStore = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const dataSourceMetadata = useMetadataItem(dataSourceId)

    const action = useMemo((): ButtonAction => {
        // Empty visualization
        if (isVisualizationEmpty(currentVis)) {
            return 'create'
        } else if (outputType === buttonType) {
            if (
                visualizationType === 'PIVOT_TABLE' &&
                buttonType === 'EVENT' &&
                buttonVariant !== undefined
            ) {
                return lastActiveButton === buttonVariant ? 'update' : 'switch'
            }
            return 'update'
        } else {
            return 'switch'
        }
    }, [
        buttonType,
        buttonVariant,
        currentVis,
        lastActiveButton,
        outputType,
        visualizationType,
    ])

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

    const programCountInLayout = useMemo(() => {
        const programs = new Set<string>()

        layoutDimensionIds.forEach((dimensionId) => {
            const programId =
                metadataStore.getDimensionMetadataItem(dimensionId)?.programId

            if (programId) {
                programs.add(programId)
            }
        })

        return programs.size
    }, [layoutDimensionIds, metadataStore])

    const hasNoProgramInLayout: boolean = programCountInLayout === 0
    const hasMultipleProgramsInLayout: boolean = programCountInLayout > 1

    const hasMultipleProgramStagesInLayout: boolean = useMemo(() => {
        const programStages = layoutDimensionIds.reduce(
            (programStages, dimensionId) => {
                const dimensionMetadata =
                    metadataStore.getDimensionMetadataItem(dimensionId)

                const programStage =
                    dimensionMetadata?.programStageId &&
                    metadataStore.getProgramStageMetadataItem(
                        dimensionMetadata.programStageId
                    )

                if (programStage) {
                    programStages[programStage.id] = programStage
                }

                return programStages
            },
            {}
        )

        return Object.keys(programStages).length > 1
    }, [layoutDimensionIds, metadataStore])

    const hasProgramIndicatorsInLayout: boolean = useMemo(
        () =>
            layoutDimensionIds.some(
                (dimensionId) =>
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionType === 'PROGRAM_INDICATOR'
            ),
        [layoutDimensionIds, metadataStore]
    )

    const isRegistrationDateInLayout = useMemo(() => {
        if (isDataSourceProgramWithRegistration(dataSourceMetadata)) {
            const tetId = dataSourceMetadata.trackedEntityType.id

            return isDimensionInLayout(layout, `${tetId}.created`)
        }

        return false
    }, [dataSourceMetadata, layout])

    const isRegistrationOuInLayout = useMemo(() => {
        if (isDataSourceProgramWithRegistration(dataSourceMetadata)) {
            const tetId = dataSourceMetadata.trackedEntityType.id

            return isDimensionInLayout(layout, `${tetId}.enrollmentOu`)
        }

        return false
    }, [dataSourceMetadata, layout])

    const tooltipConfig = useMemo((): TooltipContent => {
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
                return getEventTooltipContent({
                    buttonVariant,
                    hasNoProgramInLayout,
                    hasMultipleProgramsInLayout,
                    hasMultipleProgramStagesInLayout,
                    isRegistrationDateInLayout,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'ENROLLMENT':
                return getEnrollmentTooltipContent({
                    dataSourceMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasMultipleProgramsInLayout,
                    isRegistrationDateInLayout,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'TRACKED_ENTITY_INSTANCE':
                return getTrackedEntityInstanceTooltipContent({
                    dataSourceMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasMultipleProgramsInLayout,
                    hasProgramIndicatorsInLayout,
                    visualizationType,
                })
        }
    }, [
        buttonType,
        buttonVariant,
        dataSourceMetadata,
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
        hasNoProgramInLayout,
        hasMultipleProgramsInLayout,
        hasMultipleProgramStagesInLayout,
        hasProgramIndicatorsInLayout,
        isLayoutEmpty,
        isRegistrationDateInLayout,
        isRegistrationOuInLayout,
        visualizationType,
    ])

    return {
        action,
        dataSourceMetadata,
        tooltipConfig,
    }
}
