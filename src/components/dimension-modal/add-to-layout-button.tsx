import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { getAvailableAxes } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getAxisName } from '@modules/layout.js'
import { getUiActiveDimensionModal } from '@store/ui-slice.js'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice.js'
import type { Axis } from '@types'
import { useCallback, type FC } from 'react'

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

    const onAxisClick = useCallback(
        (axisId: Axis): void => {
            dispatch(
                addVisUiConfigLayoutDimension({ axis: axisId, dimensionId })
            )

            onClick()
        },
        [dispatch, dimensionId, onClick]
    )

    return (
        <ButtonStrip>
            {availableAxes.map((axisId) => (
                <Button
                    small
                    key={axisId}
                    onClick={() => onAxisClick(axisId)}
                    dataTest={`${dataTest}-${axisId}`}
                >
                    {i18n.t('Add to {{axisName}}', {
                        axisName: getAxisName(axisId),
                    })}
                </Button>
            ))}
        </ButtonStrip>
    )
}
