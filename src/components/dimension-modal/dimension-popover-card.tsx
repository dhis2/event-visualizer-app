import { getAvailableAxes } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { ButtonStrip, Button } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getAxisName, isDimensionInLayout } from '@modules/layout'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
    moveVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimensionFromAxis,
    setVisUiConfigConditionsByDimension,
    setVisUiConfigItemsByDimension,
    setVisUiConfigRepetitionsByDimension,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionMetadataItem } from '@types'
import cx from 'classnames'
import { useCallback, useMemo, type FC, type KeyboardEvent } from 'react'
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

type SidebarAddToolbarProps = {
    dimensionId: string
    onAdd: (axisId: Axis) => void
}

const SidebarAddToolbar: FC<SidebarAddToolbarProps> = ({
    dimensionId,
    onAdd,
}) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const availableAxes = getAvailableAxes(visType)

    return (
        <div className={classes.popoverToolbar}>
            <ButtonStrip>
                {availableAxes.map((axisId) => (
                    <Button
                        key={axisId}
                        type="button"
                        small
                        secondary
                        onClick={() => onAdd(axisId)}
                        dataTest={`dimension-popover-toolbar-add-${axisId}-${dimensionId}`}
                    >
                        {i18n.t('Add to {{axisName}}', {
                            axisName: getAxisName(axisId).toLocaleLowerCase(),
                        })}
                    </Button>
                ))}
            </ButtonStrip>
        </div>
    )
}

type DimensionPopoverCardProps = {
    dimension: DimensionMetadataItem
    axisId?: Axis
    onClose: () => void
    showArrow?: boolean
    source?: 'layout' | 'sidebar'
}

export const DimensionPopoverCard: FC<DimensionPopoverCardProps> = ({
    dimension,
    axisId,
    onClose,
    showArrow = false,
    source = 'layout',
}) => {
    const dataTest = 'dimension-popover'

    const dispatch = useAppDispatch()
    const layout = useAppSelector(getVisUiConfigLayout)
    const isInLayout = isDimensionInLayout(layout, dimension.id)
    const showSidebarAddToolbar = source === 'sidebar' && !isInLayout
    const showFooterActions = source === 'layout' || isInLayout
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

    const onToolbarAdd = useCallback(
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

    return (
        <div
            className={cx(classes.popoverCard, {
                [classes.withArrow]: showArrow,
            })}
            data-test={dataTest}
            onKeyDown={onKeyDown}
            role="dialog"
        >
            {showArrow && <span className={classes.popoverArrow} />}
            {showSidebarAddToolbar && (
                <SidebarAddToolbar
                    dimensionId={dimension.id}
                    onAdd={onToolbarAdd}
                />
            )}
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
                </footer>
            )}
        </div>
    )
}
