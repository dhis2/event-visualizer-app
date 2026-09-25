import { AXES } from '@constants/axis'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuDivider, MenuItem } from '@dhis2/ui'
import { useAppDispatch } from '@hooks'
import { getAxisName } from '@modules/layout'
import { moveVisUiConfigCustomValueToAxis } from '@store/vis-ui-config-slice'
import type { Axis } from '@types'
import { useCallback, type FC } from 'react'

type ValueChipMenuProps = {
    onReset: () => void
    onClose: () => void
}

export const ValueChipMenu: FC<ValueChipMenuProps> = ({ onReset, onClose }) => {
    const dataTest = 'value-chip-menu'
    const dispatch = useAppDispatch()

    const moveToAxis = useCallback(
        (axis: Axis) => {
            dispatch(moveVisUiConfigCustomValueToAxis({ axis }))
            onClose()
        },
        [dispatch, onClose]
    )

    return (
        <FlyoutMenu dense>
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
