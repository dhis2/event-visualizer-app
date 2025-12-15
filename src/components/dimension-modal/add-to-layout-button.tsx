import i18n from '@dhis2/d2-i18n'
import { SplitButton, FlyoutMenu, MenuItem, Button } from '@dhis2/ui'
import { useCallback, type FC } from 'react'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { getAvailableAxes } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getAxisName } from '@modules/layout.js'
import { getUiActiveDimensionModal } from '@store/ui-slice.js'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice.js'
import type { Axis } from '@types'

type AddToLayoutButtonProps = {
    onClick: () => void
    dataTest?: string
}

export const AddToLayoutButton: FC<AddToLayoutButtonProps> = ({
    onClick,
    dataTest = 'add-to-layout-button',
}) => {
    const dispatch = useAppDispatch()

    const dimensionId = useAppSelector(
        getUiActiveDimensionModal
    ) as LayoutDimension['id']
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const availableAxes = getAvailableAxes(visType)

    const onMenuItemClick = useCallback(
        (axisId: Axis): void => {
            dispatch(
                addVisUiConfigLayoutDimension({ axis: axisId, dimensionId })
            )

            onClick()
        },
        [dispatch, dimensionId, onClick]
    )

    const getButtonLabel = useCallback(
        (axisId: Axis): string =>
            i18n.t(`Add to {{axisName}}`, {
                axisName: getAxisName(axisId),
            }),
        []
    )

    return availableAxes.length > 1 ? (
        <SplitButton
            component={
                <FlyoutMenu
                    maxWidth="380px"
                    dataTest={`${dataTest}-flyout-menu`}
                >
                    {availableAxes.slice(1).map((axisId) => (
                        <MenuItem
                            key={axisId}
                            dataTest={`${dataTest}-flyout-menu-option-${axisId}`}
                            onClick={() => onMenuItemClick(axisId)}
                            label={getButtonLabel(axisId)}
                        />
                    ))}
                </FlyoutMenu>
            }
            onClick={() => onMenuItemClick(availableAxes[0])}
            dataTest={dataTest}
        >
            {getButtonLabel(availableAxes[0])}
        </SplitButton>
    ) : (
        <Button
            onClick={() => onMenuItemClick(availableAxes[0])}
            dataTest={dataTest}
        >
            {getButtonLabel(availableAxes[0])}
        </Button>
    )
}
