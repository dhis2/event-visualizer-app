import i18n from '@dhis2/d2-i18n'
import { IconSync16, Tooltip } from '@dhis2/ui'
import cx from 'classnames'
import { useMemo, type FC } from 'react'
import classes from './styles/bottom-bar.module.css'
import {
    useAppSelector,
    useAppDispatch,
    useMetadataItem,
    useMetadataStore,
} from '@hooks'
import {
    isDataSourceProgramWithoutRegistration,
    isDataSourceProgramWithRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import { isDimensionInLayout } from '@modules/layout'
import { isVisualizationEmpty } from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    getVisUiConfigLayout,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
    setVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import type { OutputType } from '@types'

type ButtonAction = 'create' | 'switch' | 'update'

type BaseButtonProps = {
    action: ButtonAction
    disabled?: boolean
    label: string
    tooltipProps?: object
    type: OutputType
}

const BaseButton: FC<BaseButtonProps> = ({
    action,
    disabled = false,
    label,
    tooltipProps,
    type,
}) => {
    const dispatch = useAppDispatch()

    const onClick = () => {
        dispatch(setVisUiConfigOutputType(type))

        dispatch(tUpdateCurrentVisFromVisUiConfig())
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cx(classes.button, {
                [classes.disabled]: disabled,
                [classes.update]: action === 'update',
            })}
            {...tooltipProps}
        >
            {action === 'update' && <IconSync16 />}
            {label}
        </button>
    )
}

const ActionButtonWithConditionalTooltip: FC<
    BaseButtonProps & {
        tooltipConfig?: { content: string; openDelay?: number }
    }
> = ({ tooltipConfig, ...props }) => {
    if (tooltipConfig) {
        const { content, openDelay = 500 } = tooltipConfig

        return (
            <Tooltip content={content} openDelay={openDelay}>
                {(tooltipProps) => (
                    <BaseButton {...props} tooltipProps={tooltipProps} />
                )}
            </Tooltip>
        )
    }

    return <BaseButton {...props} />
}

export const EventButton: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const { action, dataSourceMetadata, tooltipConfig } =
        useActionButton('EVENT')

    const eventLabel = useMemo(() => {
        if (
            isDataSourceProgramWithRegistration(dataSourceMetadata) &&
            dataSourceMetadata.displayEventLabel
        ) {
            return dataSourceMetadata.displayEventLabel
        }

        return 'Event' // XXX: translations ?!
    }, [dataSourceMetadata])

    const label = useMemo(() => {
        const targetVisualization =
            visualizationType === 'LINE_LIST'
                ? i18n.t(`{{ eventLabel }} list`, { eventLabel })
                : i18n.t(`{{ eventLabel }} table`, { eventLabel })

        switch (action) {
            case 'create':
                return i18n.t(`Create {{targetVisualization}}`, {
                    targetVisualization,
                })
            case 'switch':
                return i18n.t(`Switch to {{targetVisualization}}`, {
                    targetVisualization,
                })
            case 'update':
                return i18n.t(`Update {{targetVisualization}}`, {
                    targetVisualization,
                })
        }
    }, [action, eventLabel, visualizationType])

    return (
        <ActionButtonWithConditionalTooltip
            action={action}
            disabled={Boolean(tooltipConfig)}
            label={label}
            tooltipConfig={tooltipConfig}
            type="EVENT"
        />
    )
}

export const EnrollmentButton: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const { action, dataSourceMetadata, tooltipConfig } =
        useActionButton('ENROLLMENT')

    const enrollmentLabel = useMemo(() => {
        if (
            isDataSourceProgramWithRegistration(dataSourceMetadata) &&
            dataSourceMetadata.displayEnrollmentLabel
        ) {
            return dataSourceMetadata.displayEnrollmentLabel
        }

        return 'Enrollment' // XXX: translations ?!
    }, [dataSourceMetadata])

    const label = useMemo(() => {
        const targetVisualization =
            visualizationType === 'LINE_LIST'
                ? i18n.t(`{{ enrollmentLabel }} list`, { enrollmentLabel })
                : i18n.t(`{{ enrollmentLabel }} table`, { enrollmentLabel })

        switch (action) {
            case 'create':
                return i18n.t(`Create {{targetVisualization}}`, {
                    targetVisualization,
                })
            case 'switch':
                return i18n.t(`Switch to {{targetVisualization}}`, {
                    targetVisualization,
                })
            case 'update':
                return i18n.t(`Update {{targetVisualization}}`, {
                    targetVisualization,
                })
        }
    }, [action, enrollmentLabel, visualizationType])

    return (
        <ActionButtonWithConditionalTooltip
            action={action}
            disabled={Boolean(tooltipConfig)}
            label={label}
            tooltipConfig={tooltipConfig}
            type="ENROLLMENT"
        />
    )
}

export const TrackedEntityInstanceButton: FC = () => {
    const { action, dataSourceMetadata, tooltipConfig } = useActionButton(
        'TRACKED_ENTITY_INSTANCE'
    )

    const trackedEntityTypeName = useMemo(() => {
        if (isDataSourceProgramWithRegistration(dataSourceMetadata)) {
            return dataSourceMetadata.trackedEntityType.name
        } else if (isDataSourceTrackedEntityType(dataSourceMetadata)) {
            return dataSourceMetadata.name
        } else {
            return 'tracked entity' // XXX: what about translations?
        }
    }, [dataSourceMetadata])

    const label = useMemo(() => {
        switch (action) {
            case 'create':
                return i18n.t(`Create {{trackedEntityTypeName}} list`, {
                    trackedEntityTypeName,
                })
            case 'switch':
                return i18n.t(`Switch to {{trackedEntityTypeName}} list`, {
                    trackedEntityTypeName,
                })
            case 'update':
                return i18n.t(`Update {{trackedEntityTypeName}} list`, {
                    trackedEntityTypeName,
                })
        }
    }, [action, trackedEntityTypeName])

    return (
        <ActionButtonWithConditionalTooltip
            action={action}
            disabled={Boolean(tooltipConfig)}
            label={label}
            tooltipConfig={tooltipConfig}
            type="TRACKED_ENTITY_INSTANCE"
        />
    )
}

export const useActionButton = (buttonType: OutputType) => {
    const currentVis = useAppSelector(getCurrentVis)
    const dataSourceId = useAppSelector(getDataSourceId)
    const layout = useAppSelector(getVisUiConfigLayout)
    const metadataStore = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const dataSourceMetadata = useMetadataItem(dataSourceId)

    console.log('ds metadata', dataSourceMetadata)

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
            const dimensionMetadata =
                metadataStore.getDimensionMetadata(dimensionId)

            return dimensionMetadata.dimension?.dimensionType === 'CATEGORY'
        })
    }, [layout, metadataStore])

    const hasCategoryOptionGroupSetInLayout: boolean = useMemo(() => {
        const dimensionIds = Object.values(layout).flat()

        return dimensionIds.some((dimensionId) => {
            const dimensionMetadata =
                metadataStore.getDimensionMetadata(dimensionId)

            return (
                dimensionMetadata.dimension?.dimensionType ===
                'CATEGORY_OPTION_GROUP_SET'
            )
        })
    }, [layout, metadataStore])

    const hasMultiplePrograms: boolean = useMemo(() => {
        const programs = Object.values(layout)
            .flat()
            .reduce((programs, dimensionId) => {
                const dimensionMetadata =
                    metadataStore.getDimensionMetadata(dimensionId)

                const programId = dimensionMetadata.programId

                if (programId) {
                    programs[programId] = dimensionMetadata.program
                }

                return programs
            }, {})

        return Object.keys(programs).length > 1
    }, [layout, metadataStore])

    const hasMultipleProgramStages: boolean = useMemo(() => {
        const programStages = Object.values(layout)
            .flat()
            .reduce((programStages, dimensionId) => {
                const dimensionMetadata =
                    metadataStore.getDimensionMetadata(dimensionId)

                const programStageId = dimensionMetadata.programStageId

                if (programStageId) {
                    programStages[programStageId] =
                        dimensionMetadata.programStage
                }

                return programStages
            }, {})

        return Object.keys(programStages).length > 1
    }, [layout, metadataStore])

    const hasProgramIndicatorsInLayout: boolean = useMemo(() => {
        const dimensionIds = Object.values(layout).flat()

        return dimensionIds.some((dimensionId) => {
            const dimensionMetadata =
                metadataStore.getDimensionMetadata(dimensionId)

            return (
                dimensionMetadata.dimension?.dimensionType ===
                'PROGRAM_INDICATOR'
            )
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

    const tooltipConfig = useMemo(() => {
        if (isLayoutEmpty) {
            return {
                content: i18n.t(
                    'Nothing selected. Add items to the layout to get started.'
                ),
                openDelay: 1000,
            }
        }

        if (hasMultiplePrograms && visualizationType === 'PIVOT_TABLE') {
            return {
                content: i18n.t('Not valid with multiple programs'),
            }
        }

        if (
            ['EVENT', 'ENROLLMENT'].includes(buttonType) &&
            hasMultiplePrograms &&
            visualizationType === 'LINE_LIST'
        ) {
            return {
                content: i18n.t('Not valid with multiple programs'),
            }
        }

        if (
            ['ENROLLMENT', 'EVENT'].includes(buttonType) &&
            isRegistrationDateInLayout &&
            isRegistrationOuInLayout
        ) {
            return {
                content: i18n.t(
                    'Not valid with registration date or registration org. unit'
                ),
            }
        }

        if (
            ['ENROLLMENT', 'EVENT'].includes(buttonType) &&
            isRegistrationDateInLayout
        ) {
            return {
                content: i18n.t('Not valid with registration date'),
            }
        }

        if (
            ['ENROLLMENT', 'EVENT'].includes(buttonType) &&
            isRegistrationOuInLayout
        ) {
            return {
                content: i18n.t('Not valid with registration org. unit'),
            }
        }

        if (
            ['ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'].includes(buttonType) &&
            isDataSourceProgramWithoutRegistration(dataSourceMetadata)
        ) {
            return {
                content: i18n.t('Not valid with event programs'),
            }
        }

        if (
            ['EVENT', 'TRACKED_ENTITY_INSTANCE'].includes(buttonType) &&
            hasCategoryInLayout &&
            hasCategoryOptionGroupSetInLayout
        ) {
            return {
                content: i18n.t(
                    'Not valid with categories or category option group sets'
                ),
            }
        } else if (
            ['EVENT', 'TRACKED_ENTITY_INSTANCE'].includes(buttonType) &&
            hasCategoryInLayout
        ) {
            return {
                content: i18n.t('Not valid with categories'),
            }
        } else if (
            ['EVENT', 'TRACKED_ENTITY_INSTANCE'].includes(buttonType) &&
            hasCategoryOptionGroupSetInLayout
        ) {
            return {
                content: i18n.t('Not valid with category option sets'),
            }
        }

        if (buttonType === 'EVENT' && hasMultipleProgramStages) {
            return {
                content: i18n.t('Not valid with multiple program stages'),
            }
        }

        if (
            buttonType === 'TRACKED_ENTITY_INSTANCE' &&
            visualizationType === 'LINE_LIST' &&
            hasProgramIndicatorsInLayout
        ) {
            return {
                content: i18n.t('Not valid with program indicators'),
            }
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
