import { getAvailableAxes } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    ButtonStrip,
    Button,
    IconInfo16,
    Layer,
    Popper,
    type PopperProps,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getAxisName, isDimensionInLayout } from '@modules/layout'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimensionFromAxis,
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
import { ConditionsSection } from './conditions-modal-content/conditions-section'
import { DynamicDimensionModalContent } from './dynamic-dimension-modal-content/dynamic-dimension-modal-content'
import { OrgUnitDimensionModalContent } from './orgunit-dimension-modal-content'
import { PeriodDimensionModalContent } from './period-dimension-modal-content'
import { StatusDimensionModalContent } from './status-dimension-modal-content'
import classes from './styles/dimension-modal.module.css'

const ABOUT_PLACEHOLDER_ROW_COUNT = 5

const DimensionPopoverAboutSection: FC = () => (
    <div className={classes.aboutSectionOuter}>
        <ConditionsSection
            title={i18n.t('About')}
            titleIcon={<IconInfo16 />}
            collapsible
            defaultExpanded={false}
            dataTest="dimension-popover-about-section"
        >
            <dl className={classes.aboutMetadata}>
                {Array.from(
                    { length: ABOUT_PLACEHOLDER_ROW_COUNT },
                    (_, index) => (
                        <div key={index} className={classes.aboutMetadataRow}>
                            <dt className={classes.aboutMetadataKey}>Key</dt>
                            <dd className={classes.aboutMetadataValue}>
                                value
                            </dd>
                        </div>
                    )
                )}
            </dl>
        </ConditionsSection>
    </div>
)

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
    const layout = useAppSelector(getVisUiConfigLayout)
    const isInLayout = isDimensionInLayout(layout, dimension.id)
    const showSidebarAddActions = source === 'sidebar' && !isInLayout
    const showFooterActions =
        source === 'layout' || isInLayout || showSidebarAddActions
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
                <div className={classes.popoverContentStack}>
                    <DimensionPopoverContent dimension={dimension} />
                    <DimensionPopoverAboutSection />
                </div>
            </div>
            {showFooterActions && (
                <footer
                    className={classes.popoverFooter}
                    data-test={`${dataTest}-actions`}
                >
                    {showSidebarAddActions ? (
                        <div className={classes.popoverFooterSidebarAdd}>
                            <SidebarAddActions
                                dimensionId={dimension.id}
                                onAdd={onSidebarAdd}
                            />
                        </div>
                    ) : (
                        <div className={classes.popoverFooterLayoutActions}>
                            <div className={classes.popoverFooterMoveActions}>
                                <ButtonStrip>
                                    {applicableMoveAxisIds.map(
                                        (targetAxisId) => (
                                            <Button
                                                key={targetAxisId}
                                                type="button"
                                                small
                                                secondary
                                                onClick={() =>
                                                    onMove(targetAxisId)
                                                }
                                                dataTest={`${dataTest}-action-move-to-${targetAxisId}`}
                                            >
                                                {i18n.t(
                                                    'Move to {{axisName}}',
                                                    {
                                                        axisName:
                                                            getAxisName(
                                                                targetAxisId
                                                            ).toLocaleLowerCase(),
                                                    }
                                                )}
                                            </Button>
                                        )
                                    )}
                                </ButtonStrip>
                            </div>
                            <div className={classes.popoverFooterEndActions}>
                                <ButtonStrip>
                                    {!isInLayout && (
                                        <AddToLayoutButton
                                            dimensionId={dimension.id}
                                            onClick={onClose}
                                            dataTest={`${dataTest}-action-confirm`}
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        small
                                        secondary
                                        onClick={onRemove}
                                        dataTest={`${dataTest}-action-remove`}
                                    >
                                        {i18n.t('Remove')}
                                    </Button>
                                </ButtonStrip>
                            </div>
                        </div>
                    )}
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
