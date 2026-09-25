import { AXES } from '@constants/axis'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuDivider, MenuItem } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { canDimensionBeCustomValue } from '@modules/dimension/custom-value'
import { getAxisName } from '@modules/layout'
import {
    removeVisUiConfigLayoutDimensionFromAxis,
    getVisUiConfigVisualizationType,
    moveVisUiConfigLayoutDimension,
    setVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice.js'
import type { Axis } from '@types'
import { useCallback, useMemo, type FC } from 'react'
import type { LayoutDimension } from './chip'

type ChipMenuProps = {
    axisId: Axis
    dimension: LayoutDimension
    onClose: () => void
}

export const ChipMenu: FC<ChipMenuProps> = ({ axisId, dimension, onClose }) => {
    const dataTest = 'chip-menu'
    const dimensionId = dimension.id

    const dispatch = useAppDispatch()
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const axisItemHandler = useCallback(
        ({
            dimensionId,
            targetAxisId,
        }: {
            dimensionId: LayoutDimension['id']
            targetAxisId: Axis
        }) => {
            dispatch(
                moveVisUiConfigLayoutDimension({
                    sourceAxis: axisId,
                    targetAxis: targetAxisId,
                    dimensionId,
                })
            )

            onClose()
        },
        [dispatch, axisId, onClose]
    )
    const removeItemHandler = useCallback(
        (dimensionId: LayoutDimension['id']) => {
            dispatch(
                removeVisUiConfigLayoutDimensionFromAxis({
                    axis: axisId,
                    dimensionId,
                })
            )

            onClose()
        },
        [dispatch, axisId, onClose]
    )

    /* The chip stays on its axis, the same as when it is dropped on the
     * value axis. */
    const useAsValueHandler = useCallback(() => {
        dispatch(
            setVisUiConfigCustomValue({
                id: dimensionId,
                aggregationType: 'DEFAULT',
            })
        )

        onClose()
    }, [dispatch, dimensionId, onClose])

    const canUseAsValue =
        visType === 'PIVOT_TABLE' && canDimensionBeCustomValue(dimension)

    const applicableAxisIds = useMemo<Axis[]>(
        () =>
            AXES.filter(
                (axis) =>
                    axis !== axisId &&
                    !(axis === 'rows' && visType === 'LINE_LIST')
            ),
        [visType, axisId]
    )

    return (
        <FlyoutMenu dense>
            {applicableAxisIds.map((axisId) => (
                <MenuItem
                    key={`${dimensionId}-to-${axisId}`}
                    onClick={() => {
                        axisItemHandler({
                            dimensionId,
                            targetAxisId: axisId,
                        })
                        onClose()
                    }}
                    label={i18n.t(`Move to {{- axisName}}`, {
                        axisName: getAxisName(axisId),
                    })}
                    dataTest={`${dataTest}-item-move-${dimensionId}-to-${axisId}`}
                />
            ))}
            {canUseAsValue && (
                <MenuItem
                    key={`${dimensionId}-use-as-value`}
                    onClick={useAsValueHandler}
                    label={i18n.t('Use as value')}
                    dataTest={`${dataTest}-item-use-as-value-${dimensionId}`}
                />
            )}
            {(applicableAxisIds.length > 0 || canUseAsValue) && (
                <MenuDivider key="menu-divider" dense />
            )}
            <MenuItem
                key={`remove-${dimensionId}`}
                onClick={() => removeItemHandler(dimensionId)}
                label={i18n.t('Remove')}
                dataTest={`${dataTest}-item-remove-${dimensionId}`}
            />
        </FlyoutMenu>
    )
}
