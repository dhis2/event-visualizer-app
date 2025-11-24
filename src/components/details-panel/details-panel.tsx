import { type FC } from 'react'
import { useInterpretationModalTogglers } from '@components/app-wrapper/interpretations-provider'
import { AboutAOUnit, InterpretationsUnit } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'

export const DetailsPanel: FC<{ disabled?: boolean }> = ({
    disabled = false,
}) => {
    const { openInterpretationModal } = useInterpretationModalTogglers()
    const currentVisId = useAppSelector(getCurrentVisId)

    return currentVisId ? (
        <div data-test="details-panel">
            <AboutAOUnit type="eventVisualization" id={currentVisId} />
            <InterpretationsUnit
                type="eventVisualization"
                id={currentVisId}
                disabled={disabled}
                onInterpretationClick={(interpretationId) =>
                    openInterpretationModal(interpretationId, false)
                }
                onReplyIconClick={(interpretationId) =>
                    openInterpretationModal(interpretationId, true)
                }
            />
        </div>
    ) : null
}
