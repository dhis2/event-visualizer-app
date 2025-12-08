import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuDivider, MenuItem } from '@dhis2/ui'
import { type FC } from 'react'
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

export const ChipMenu: FC<ChipMenuProps> = ({
    axisId,
    dimensionId,
    onClose,
}) => {
    //    const dispatch = useAppDispatch()
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const dataTest = 'chip-menu'

    const axisItemHandler = ({ dimensionId, axisId }) => {
        //        dispatch(
        //            acAddUiLayoutDimensions(
        //                { [dimensionId]: { axisId } },
        //                dimensionMetadata
        //            )
        //        )

        console.log(`TBD: move dimension ${dimensionId} to axis ${axisId}`)

        onClose()
    }

    const removeItemHandler = (dimensionId) => {
        //        dispatch(acRemoveUiLayoutDimensions(id))

        console.log(`TBD: remove dimension ${dimensionId} from layout`)

        onClose()
    }

    const availableAxisIds: Axis[] =
        visType === 'LINE_LIST'
            ? ['columns', 'filters']
            : ['columns', 'rows', 'filters']

    const applicableAxisIds = availableAxisIds.filter(
        (availableAxisId) => availableAxisId !== axisId
    )

    const menuItems =
        // Move to [Columns, Rows, Filter] item(s)
        applicableAxisIds.map((axisId) => (
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
        ))

    // Divider
    if (applicableAxisIds.length) {
        menuItems.push(<MenuDivider key="menu-divider" dense />)
    }

    // Remove item
    menuItems.push(
        <MenuItem
            key={`remove-${dimensionId}`}
            onClick={() => removeItemHandler(dimensionId)}
            label={i18n.t('Remove')}
            dataTest={`${dataTest}-item-remove-${dimensionId}`}
        />
    )

    return <FlyoutMenu dense>{menuItems}</FlyoutMenu>
}
