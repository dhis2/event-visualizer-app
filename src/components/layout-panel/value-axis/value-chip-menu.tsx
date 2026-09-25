import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { AXES } from '@constants/axis'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, IconCheckmark16, MenuDivider, MenuItem } from '@dhis2/ui'
import { useAggregationTypeOptions, useAppDispatch } from '@hooks'
import { getAxisName } from '@modules/layout'
import {
    moveVisUiConfigCustomValueToAxis,
    setVisUiConfigCustomValueAggregationType,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import type { AggregationType, Axis } from '@types'
import { useCallback, type FC } from 'react'
import classes from './styles/value-chip-menu.module.css'

type ValueChipMenuProps = {
    dimension: LayoutDimension
    customValue: CustomValueObject
    onReset: () => void
    onClose: () => void
}

export const ValueChipMenu: FC<ValueChipMenuProps> = ({
    dimension,
    customValue,
    onReset,
    onClose,
}) => {
    const dataTest = 'value-chip-menu'
    const dispatch = useAppDispatch()
    const { options: aggregationTypeOptions } = useAggregationTypeOptions({
        dimensionId: dimension.id,
        dimensionType: dimension.dimensionType,
    })

    const moveToAxis = useCallback(
        (axis: Axis) => {
            dispatch(moveVisUiConfigCustomValueToAxis({ axis }))
            onClose()
        },
        [dispatch, onClose]
    )

    const setAggregationType = useCallback(
        (aggregationType: AggregationType) => {
            dispatch(setVisUiConfigCustomValueAggregationType(aggregationType))
            onClose()
        },
        [dispatch, onClose]
    )

    return (
        <FlyoutMenu dense>
            <MenuItem
                label={i18n.t('Aggregation mode')}
                dataTest={`${dataTest}-item-aggregation`}
            >
                {aggregationTypeOptions.map(({ value, label, disabled }) => {
                    const isSelected = value === customValue.aggregationType
                    return (
                        <MenuItem
                            key={value}
                            label={label}
                            disabled={disabled}
                            checkbox
                            checked={isSelected}
                            icon={
                                isSelected ? (
                                    <IconCheckmark16 />
                                ) : (
                                    <span className={classes.iconSpacer} />
                                )
                            }
                            onClick={() => setAggregationType(value)}
                            dataTest={`${dataTest}-item-aggregation-${value}`}
                        />
                    )
                })}
            </MenuItem>
            <MenuDivider dense />
            {AXES.map((axis) => (
                <MenuItem
                    key={axis}
                    onClick={() => moveToAxis(axis)}
                    label={i18n.t(`Move to {{- axisName}}`, {
                        axisName: getAxisName(axis),
                    })}
                    dataTest={`${dataTest}-item-move-to-${axis}`}
                />
            ))}
            <MenuDivider dense />
            <MenuItem
                onClick={() => {
                    onReset()
                    onClose()
                }}
                label={i18n.t('Reset to count')}
                dataTest={`${dataTest}-item-reset`}
            />
        </FlyoutMenu>
    )
}
