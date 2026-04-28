import actionButtonClasses from '@components/layout-panel/bottom-bar/action-buttons/styles/action-buttons.module.css'
import { getAvailableAxes } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    ButtonStrip,
    Button,
    IconSync16,
    Layer,
    Popper,
    type PopperProps,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useMetadataItem } from '@hooks'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import { getAxisName, isDimensionInLayout } from '@modules/layout'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigLastActiveButton,
    getVisUiConfigLayout,
    getVisUiConfigOutputType,
    getVisUiConfigVisualizationType,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimensionFromAxis,
    setVisUiConfigConditionsByDimension,
    setVisUiConfigItemsByDimension,
    setVisUiConfigRepetitionsByDimension,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionMetadataItem } from '@types'
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    type FC,
    type KeyboardEvent,
    type RefObject,
} from 'react'
import { AddToLayoutButton } from './add-to-layout-button'
import { ConditionsModalContent } from './conditions-modal-content/conditions-modal-content'
import { DynamicDimensionModalContent } from './dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from './orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from './period-dimension-modal-content'
import { StatusDimensionModalContent } from './status-dimension-modal-content'
import classes from './styles/dimension-modal.module.css'

type DimensionPopoverContentProps = {
    dimension: DimensionMetadataItem
}

const DimensionPopoverContent: FC<DimensionPopoverContentProps> = ({
    dimension,
}) => {
    switch (dimension.dimensionType) {
        case 'ORGANISATION_UNIT':
            return <OrgUnitDimensionModalContent dimension={dimension} />
        case 'STATUS':
            return <StatusDimensionModalContent dimension={dimension} />
        case 'PERIOD':
            return <PeriodDimensionModalContent dimension={dimension} />
        case 'CATEGORY':
        case 'CATEGORY_OPTION_GROUP_SET':
        case 'ORGANISATION_UNIT_GROUP_SET':
            return <DynamicDimensionModalContent dimension={dimension} />
        default:
            return <ConditionsModalContent dimension={dimension} />
    }
}

type SidebarAddActionsProps = {
    dimensionId: string
    onAdd: (axisId: Axis) => void
}

const SidebarAddActions: FC<SidebarAddActionsProps> = ({
    dimensionId,
    onAdd,
}) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const availableAxes = getAvailableAxes(visType)

    return (
        <ButtonStrip>
            {availableAxes.map((axisId) => (
                <Button
                    key={axisId}
                    type="button"
                    small
                    onClick={() => onAdd(axisId)}
                    dataTest={`dimension-popover-action-add-${axisId}-${dimensionId}`}
                >
                    {i18n.t('Add to {{axisName}}', {
                        axisName: getAxisName(axisId).toLocaleLowerCase(),
                    })}
                </Button>
            ))}
        </ButtonStrip>
    )
}

type DimensionPopoverCardProps = {
    dimension: DimensionMetadataItem
    axisId?: Axis
    onClose: () => void
    referenceRef?: RefObject<HTMLElement>
    source?: 'layout' | 'sidebar'
}

export const DimensionPopoverCard: FC<DimensionPopoverCardProps> = ({
    dimension,
    axisId,
    onClose,
    referenceRef,
    source = 'layout',
}) => {
    const dataTest = 'dimension-popover'
    const popoverRef = useRef<HTMLDivElement>(null)

    const dispatch = useAppDispatch()
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSourceMetadata = useMetadataItem(dataSourceId)
    const lastActiveButton = useAppSelector(getVisUiConfigLastActiveButton)
    const layout = useAppSelector(getVisUiConfigLayout)
    const isInLayout = isDimensionInLayout(layout, dimension.id)
    const showSidebarAddActions = source === 'sidebar' && !isInLayout
    const showUpdateAction = isInLayout
    const showFooterActions =
        source === 'layout' || isInLayout || showSidebarAddActions
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const currentAxisId = useMemo<Axis | undefined>(() => {
        if (axisId) {
            return axisId
        }

        return getAvailableAxes(visType).find((axis) =>
            layout[axis].includes(dimension.id)
        )
    }, [axisId, dimension.id, layout, visType])
    const applicableMoveAxisIds = useMemo<Axis[]>(
        () =>
            currentAxisId
                ? getAvailableAxes(visType).filter(
                      (targetAxisId) => targetAxisId !== currentAxisId
                  )
                : [],
        [currentAxisId, visType]
    )
    const updateButtonLabel = useMemo(() => {
        const isTable = visType === 'PIVOT_TABLE'

        switch (outputType) {
            case 'EVENT': {
                if (isTable && lastActiveButton === 'CUSTOM_VALUE') {
                    return i18n.t('Update custom value table')
                }

                const eventLabel =
                    isDataSourceProgramWithRegistration(dataSourceMetadata) &&
                    dataSourceMetadata.displayEventLabel
                        ? dataSourceMetadata.displayEventLabel
                        : i18n.t('Event')

                return isTable
                    ? i18n.t('Update {{eventLabel}} table', { eventLabel })
                    : i18n.t('Update {{eventLabel}} list', { eventLabel })
            }
            case 'ENROLLMENT': {
                const enrollmentLabel =
                    isDataSourceProgramWithRegistration(dataSourceMetadata) &&
                    dataSourceMetadata.displayEnrollmentLabel
                        ? dataSourceMetadata.displayEnrollmentLabel
                        : i18n.t('Enrollment')

                return isTable
                    ? i18n.t('Update {{enrollmentLabel}} table', {
                          enrollmentLabel,
                      })
                    : i18n.t('Update {{enrollmentLabel}} list', {
                          enrollmentLabel,
                      })
            }
            case 'TRACKED_ENTITY_INSTANCE': {
                const trackedEntityTypeName =
                    isDataSourceProgramWithRegistration(dataSourceMetadata)
                        ? dataSourceMetadata.trackedEntityType.name
                        : isDataSourceTrackedEntityType(dataSourceMetadata)
                          ? dataSourceMetadata.name
                          : i18n.t('tracked entity')

                return i18n.t('Update {{trackedEntityTypeName}} list', {
                    trackedEntityTypeName,
                })
            }
        }
    }, [dataSourceMetadata, lastActiveButton, outputType, visType])

    const onMove = useCallback(
        (targetAxisId: Axis) => {
            if (!currentAxisId) {
                return
            }

            dispatch(
                moveVisUiConfigLayoutDimension({
                    sourceAxis: currentAxisId,
                    targetAxis: targetAxisId,
                    dimensionId: dimension.id,
                })
            )
            onClose()
        },
        [currentAxisId, dimension.id, dispatch, onClose]
    )

    const onResetFilters = useCallback(() => {
        dispatch(
            setVisUiConfigItemsByDimension({
                dimensionId: dimension.id,
                itemIds: [],
            })
        )
        dispatch(
            setVisUiConfigConditionsByDimension({ dimensionId: dimension.id })
        )
        dispatch(
            setVisUiConfigRepetitionsByDimension({ dimensionId: dimension.id })
        )
        onClose()
    }, [dimension.id, dispatch, onClose])

    const onRemove = useCallback(() => {
        if (!currentAxisId) {
            return
        }

        dispatch(
            removeVisUiConfigLayoutDimensionFromAxis({
                axis: currentAxisId,
                dimensionId: dimension.id,
            })
        )
        onClose()
    }, [currentAxisId, dimension.id, dispatch, onClose])

    const onUpdate = useCallback(() => {
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [dispatch, onClose])

    const onSidebarAdd = useCallback(
        (axisId: Axis) => {
            dispatch(
                addVisUiConfigLayoutDimension({
                    axis: axisId,
                    dimensionId: dimension.id,
                })
            )
            onClose()
        },
        [dispatch, dimension.id, onClose]
    )

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
            }
        },
        [onClose]
    )

    useEffect(() => {
        const closeOnOutsidePointerDown = (event: PointerEvent) => {
            const target = event.target

            if (!(target instanceof Node)) {
                return
            }

            if (popoverRef.current?.contains(target)) {
                return
            }

            if (referenceRef?.current?.contains(target)) {
                return
            }

            if (
                target instanceof Element &&
                target.closest(
                    '[data-test="dhis2-uicore-layer"], [data-test="dhis2-uicore-popper"]'
                )
            ) {
                return
            }

            onClose()
        }

        document.addEventListener('pointerdown', closeOnOutsidePointerDown, {
            capture: true,
        })

        return () => {
            document.removeEventListener(
                'pointerdown',
                closeOnOutsidePointerDown,
                {
                    capture: true,
                }
            )
        }
    }, [onClose, referenceRef])

    return (
        <div
            ref={popoverRef}
            className={classes.popoverCard}
            data-test={dataTest}
            onKeyDown={onKeyDown}
            role="dialog"
        >
            <div
                className={classes.popoverContent}
                data-test={`${dataTest}-content`}
            >
                <DimensionPopoverContent dimension={dimension} />
            </div>
            {showFooterActions && (
                <footer
                    className={classes.popoverFooter}
                    data-test={`${dataTest}-actions`}
                >
                    {showUpdateAction && (
                        <button
                            type="button"
                            onClick={onUpdate}
                            className={`${actionButtonClasses.button} ${actionButtonClasses.update}`}
                            data-test={`${dataTest}-action-update`}
                        >
                            <IconSync16 />
                            {updateButtonLabel}
                        </button>
                    )}
                    <div
                        className={
                            showSidebarAddActions
                                ? classes.popoverFooterActionsLeft
                                : classes.popoverFooterActions
                        }
                    >
                        {showSidebarAddActions ? (
                            <SidebarAddActions
                                dimensionId={dimension.id}
                                onAdd={onSidebarAdd}
                            />
                        ) : (
                            <ButtonStrip>
                                {applicableMoveAxisIds.map((targetAxisId) => (
                                    <Button
                                        key={targetAxisId}
                                        type="button"
                                        small
                                        secondary
                                        onClick={() => onMove(targetAxisId)}
                                        dataTest={`${dataTest}-action-move-to-${targetAxisId}`}
                                    >
                                        {i18n.t('Move to {{axisName}}', {
                                            axisName:
                                                getAxisName(
                                                    targetAxisId
                                                ).toLocaleLowerCase(),
                                        })}
                                    </Button>
                                ))}
                                <Button
                                    type="button"
                                    small
                                    secondary
                                    onClick={onResetFilters}
                                    dataTest={`${dataTest}-action-reset-filters`}
                                >
                                    {i18n.t('Reset filters')}
                                </Button>
                                <Button
                                    type="button"
                                    small
                                    secondary
                                    onClick={onRemove}
                                    dataTest={`${dataTest}-action-remove`}
                                >
                                    {i18n.t('Remove')}
                                </Button>
                                {!isInLayout && (
                                    <AddToLayoutButton
                                        dimensionId={dimension.id}
                                        onClick={onClose}
                                        dataTest={`${dataTest}-action-confirm`}
                                    />
                                )}
                            </ButtonStrip>
                        )}
                    </div>
                </footer>
            )}
        </div>
    )
}

type DimensionPopoverProps = Omit<DimensionPopoverCardProps, 'referenceRef'> & {
    placement: PopperProps['placement']
    referenceRef: RefObject<HTMLElement>
}

export const DimensionPopover: FC<DimensionPopoverProps> = ({
    placement,
    referenceRef,
    ...popoverCardProps
}) => (
    <Layer className={classes.nonBlockingLayer}>
        <Popper
            className={classes.nonBlockingPopper}
            reference={referenceRef}
            placement={placement}
        >
            <DimensionPopoverCard
                {...popoverCardProps}
                referenceRef={referenceRef}
            />
        </Popper>
    </Layer>
)
