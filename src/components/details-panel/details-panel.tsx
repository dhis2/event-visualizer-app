import { useCallback, type FC } from 'react'
import { AboutAOUnit, InterpretationsUnit } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'

export const DetailsPanel: FC<{ disabled?: boolean }> = ({
    disabled = false,
}) => {
    const dispatch = useAppDispatch()
    const currentVisId = useAppSelector(getCurrentVisId)

    const navigateToOpenModal = useCallback(
        (visualizationId, interpretationId) =>
            dispatch(
                setNavigationState({
                    visualizationId,
                    interpretationId,
                })
            ),
        [dispatch]
    )

    return currentVisId ? (
        <>
            <AboutAOUnit type="eventVisualization" id={currentVisId} />
            <InterpretationsUnit
                type="eventVisualization"
                id={currentVisId}
                disabled={disabled}
                onInterpretationClick={(interpretationId) =>
                    navigateToOpenModal(currentVisId, interpretationId)
                }
                onReplyIconClick={(interpretationId) =>
                    navigateToOpenModal(currentVisId, interpretationId)
                }
            />
        </>
    ) : null
}
