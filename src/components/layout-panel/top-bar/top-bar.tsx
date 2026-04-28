import { CustomValueButton } from '@components/layout-panel/bottom-bar/action-buttons/custom-value-button'
import { EnrollmentButton } from '@components/layout-panel/bottom-bar/action-buttons/enrollment-button'
import { EventButton } from '@components/layout-panel/bottom-bar/action-buttons/event-button'
import { TrackedEntityInstanceButton } from '@components/layout-panel/bottom-bar/action-buttons/tracked-entity-instance-button'
import { useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { type FC } from 'react'
import { ExpandedLayoutPanelToggler } from './expanded-layout-panel-toggler'
import { OptionsButton } from './options-button'
import classes from './styles/top-bar.module.css'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'

export const TopBar: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    return (
        <div
            className={cx(classes.topBar, {
                [classes.loading]: isVisualizationLoading,
            })}
        >
            {!isVisualizationLoading && (
                <div className={classes.container}>
                    {dataSourceId && (
                        <div
                            className={classes.updateButtons}
                            data-test="update-buttons"
                        >
                            <EventButton />
                            <EnrollmentButton />
                            {visualizationType === 'PIVOT_TABLE' ? (
                                <CustomValueButton />
                            ) : (
                                <TrackedEntityInstanceButton />
                            )}
                        </div>
                    )}
                    <div className={classes.visualizationControls}>
                        <VisualizationTypeSelector />
                        <OptionsButton />
                    </div>
                    <div className={classes.containerSpacer} />
                    {dataSourceId && <ExpandedLayoutPanelToggler />}
                </div>
            )}
        </div>
    )
}
