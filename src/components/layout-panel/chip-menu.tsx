import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuDivider, MenuItem } from '@dhis2/ui'
import { useCallback, useMemo, type FC } from 'react'
import type { LayoutDimension } from './chip'
import { /* useAppDispatch,*/ useAppSelector } from '@hooks'
import { getAxisName } from '@modules/layout'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice.js'
import type { Axis } from '@types'

type ChipMenuProps = {
    axisId: Axis
    dimensionId: LayoutDimension['id']
    onClose: () => void
}
const AXIS_IDS: Axis[] = ['columns', 'rows', 'filters']

export const ChipMenu: FC<ChipMenuProps> = ({
    axisId,
    dimensionId,
    onClose,
}) => {
    // const dispatch = useAppDispatch()
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const dataTest = 'chip-menu'
    const axisItemHandler = useCallback(
        ({ dimensionId, axisId }: { dimensionId: string; axisId: Axis }) => {
            // dispatch(
            //     acAddUiLayoutDimensions(
            //         { [dimensionId]: { axisId } },
            //         dimensionMetadata
            //     )
            // )
            console.log(`TBD: move dimension ${dimensionId} to axis ${axisId}`)
            onClose()
        },
        [onClose]
    )
    const removeItemHandler = useCallback(
        (dimensionId: string) => {
            // dispatch(acRemoveUiLayoutDimensions(id))
            console.log(`TBD: remove dimension ${dimensionId} from layout`)
            onClose()
        },
        [onClose]
    )

    const applicableAxisIds = useMemo<Axis[]>(
        () =>
            AXIS_IDS.filter(
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
                            axisId,
                        })
                        onClose()
                    }}
                    label={i18n.t(`Move to {{axisName}}`, {
                        axisName: getAxisName(axisId),
                    })}
                    dataTest={`${dataTest}-item-move-${dimensionId}-to-${axisId}`}
                />
            ))}
            {applicableAxisIds.length > 0 && (
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
