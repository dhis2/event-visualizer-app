import { getAvailableAxes } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    SplitButton,
    FlyoutMenu,
    MenuItem,
    Button,
    ButtonStrip,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getAxisName } from '@modules/layout.js'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice.js'
import type { Axis } from '@types'
import { useCallback, type FC } from 'react'

type AddToLayoutButtonProps = {
    dimensionId: string
    onClick: (axisId: Axis) => void
    dataTest?: string
    variant?: 'split' | 'buttons'
}

export const AddToLayoutButton: FC<AddToLayoutButtonProps> = ({
    dimensionId,
    onClick,
    dataTest = 'add-to-layout-button',
    variant = 'split',
}) => {
    const dispatch = useAppDispatch()
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const availableAxes = getAvailableAxes(visType)

    const onMenuItemClick = useCallback(
        (axisId: Axis): void => {
            dispatch(
                addVisUiConfigLayoutDimension({ axis: axisId, dimensionId })
            )

            onClick(axisId)
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

    if (variant === 'buttons') {
        return (
            <ButtonStrip>
                {availableAxes.map((axisId) => (
                    <Button
                        key={axisId}
                        type="button"
                        small
                        onClick={() => onMenuItemClick(axisId)}
                        dataTest={`${dataTest}-${axisId}`}
                    >
                        {getButtonLabel(axisId)}
                    </Button>
                ))}
            </ButtonStrip>
        )
    }

    return availableAxes.length > 1 ? (
        <SplitButton
            small
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
