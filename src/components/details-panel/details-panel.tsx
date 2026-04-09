import { useInterpretationModalTogglers } from '@components/app-wrapper/interpretations-provider'
import { AboutAOUnit, InterpretationsUnit } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import { getUiDetailsPanelVisible } from '@store/ui-slice'
import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/details-panel.module.css'

export const DetailsPanel: FC<{ disabled?: boolean }> = ({
    disabled = false,
}) => {
    const { openInterpretationModal } = useInterpretationModalTogglers()
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)
    const currentVisId = useAppSelector(getCurrentVisId)

    return currentVisId ? (
        <div
            data-test="details-panel"
            className={cx(classes.detailsPanel, {
                [classes.hidden]: !isDetailsPanelVisible,
            })}
        >
            <div className={classes.detailsPanelContent}>
                <div className={classes.card}>
                    <AboutAOUnit type="eventVisualization" id={currentVisId} />
                </div>
                <div className={classes.card}>
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
            </div>
        </div>
    ) : null
}
