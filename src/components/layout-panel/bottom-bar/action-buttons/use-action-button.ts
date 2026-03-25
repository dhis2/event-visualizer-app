import i18n from '@dhis2/d2-i18n'
import { useMemo } from 'react'
import type { ButtonAction } from './base-button'
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
    getVisUiConfigLayout,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'

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
    hasMultiplePrograms: boolean
    hasMultipleProgramStages: boolean
    isRegistrationDateInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEventTooltipContent = ({
    hasMultiplePrograms,
    hasMultipleProgramStages,
    isRegistrationDateInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EventTooltipContentParams): TooltipContent => {
    if (
        hasMultiplePrograms &&
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
    if (hasMultipleProgramStages) {
        return { content: i18n.t('Not valid with multiple program stages') }
    }
    return undefined
}

type EnrollmentTooltipContentParams = {
    dataSourceMetadata: ReturnType<typeof useMetadataItem>
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultiplePrograms: boolean
    isRegistrationDateInLayout: boolean
    isRegistrationOuInLayout: boolean
    visualizationType: string
}

const getEnrollmentTooltipContent = ({
    dataSourceMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasMultiplePrograms,
    isRegistrationDateInLayout,
    isRegistrationOuInLayout,
    visualizationType,
}: EnrollmentTooltipContentParams): TooltipContent => {
    if (
        hasMultiplePrograms &&
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
    hasMultiplePrograms: boolean
    hasProgramIndicatorsInLayout: boolean
    visualizationType: string
}

const getTrackedEntityInstanceTooltipContent = ({
    dataSourceMetadata,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasMultiplePrograms,
    hasProgramIndicatorsInLayout,
    visualizationType,
}: TrackedEntityInstanceTooltipContentParams): TooltipContent => {
    if (hasMultiplePrograms && visualizationType === 'PIVOT_TABLE') {
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

export const useActionButton = (buttonType: OutputType) => {
    const currentVis = useAppSelector(getCurrentVis)
    const dataSourceId = useAppSelector(getDataSourceId)
    const layout = useAppSelector(getVisUiConfigLayout)
    const metadataStore = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const dataSourceMetadata = useMetadataItem(dataSourceId)

    const action = useMemo((): ButtonAction => {
        // Empty visualization
        if (isVisualizationEmpty(currentVis)) {
            return 'create'
        } else if (outputType === buttonType) {
            // visualization or error and same outputType
            return 'update'
            // visualization or error and different outputType
        } else {
            return 'switch'
        }
    }, [buttonType, currentVis, outputType])

    const hasCategoryInLayout: boolean = useMemo(() => {
        const dimensionIds = Object.values(layout).flat()

        return dimensionIds.some((dimensionId) => {
            const dimensionMetadataItem =
                metadataStore.getDimensionMetadataItem(dimensionId)

            return dimensionMetadataItem?.dimensionType === 'CATEGORY'
        })
    }, [layout, metadataStore])

    const hasCategoryOptionGroupSetInLayout: boolean = useMemo(() => {
        const dimensionIds = Object.values(layout).flat()

        return dimensionIds.some((dimensionId) => {
            const dimension =
                metadataStore.getDimensionMetadataItem(dimensionId)

            return dimension?.dimensionType === 'CATEGORY_OPTION_GROUP_SET'
        })
    }, [layout, metadataStore])

    const hasMultiplePrograms: boolean = useMemo(() => {
        const programs = Object.values(layout)
            .flat()
            .reduce((programs, dimensionId) => {
                const dimension =
                    metadataStore.getDimensionMetadataItem(dimensionId)

                const program =
                    dimension?.programId &&
                    metadataStore.getProgramMetadataItem(dimension.programId)

                if (program) {
                    programs[program.id] = program
                }

                return programs
            }, {})

        return Object.keys(programs).length > 1
    }, [layout, metadataStore])

    const hasMultipleProgramStages: boolean = useMemo(() => {
        const programStages = Object.values(layout)
            .flat()
            .reduce((programStages, dimensionId) => {
                const dimension =
                    metadataStore.getDimensionMetadataItem(dimensionId)

                const programStage =
                    dimension?.programStageId &&
                    metadataStore.getProgramStageMetadataItem(
                        dimension.programStageId
                    )

                if (programStage) {
                    programStages[programStage.id] = programStage
                }

                return programStages
            }, {})

        return Object.keys(programStages).length > 1
    }, [layout, metadataStore])

    const hasProgramIndicatorsInLayout: boolean = useMemo(() => {
        const dimensionIds = Object.values(layout).flat()

        return dimensionIds.some((dimensionId) => {
            const dimension =
                metadataStore.getDimensionMetadataItem(dimensionId)

            return dimension?.dimensionType === 'PROGRAM_INDICATOR'
        })
    }, [layout, metadataStore])

    const isLayoutEmpty: boolean = useMemo(
        () => Object.values(layout).flat().length === 0,
        [layout]
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

            return isDimensionInLayout(layout, `${tetId}.ou`)
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
                    hasMultiplePrograms,
                    hasMultipleProgramStages,
                    isRegistrationDateInLayout,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'ENROLLMENT':
                return getEnrollmentTooltipContent({
                    dataSourceMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasMultiplePrograms,
                    isRegistrationDateInLayout,
                    isRegistrationOuInLayout,
                    visualizationType,
                })
            case 'TRACKED_ENTITY_INSTANCE':
                return getTrackedEntityInstanceTooltipContent({
                    dataSourceMetadata,
                    hasCategoryInLayout,
                    hasCategoryOptionGroupSetInLayout,
                    hasMultiplePrograms,
                    hasProgramIndicatorsInLayout,
                    visualizationType,
                })
        }
    }, [
        buttonType,
        dataSourceMetadata,
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
        hasMultiplePrograms,
        hasMultipleProgramStages,
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
