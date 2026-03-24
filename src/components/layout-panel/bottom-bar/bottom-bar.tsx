import cx from 'classnames'
import { type FC } from 'react'
import { EnrollmentButton } from './action-buttons/enrollment-button'
import { EventButton } from './action-buttons/event-button'
import { TrackedEntityInstanceButton } from './action-buttons/tracked-entity-instance-button'
import { CustomValueButton } from './custom-value-button'
import classes from './styles/bottom-bar.module.css'
import { useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

export const BottomBar: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    return (
        <div
            className={cx(classes.bottomBar, {
                [classes.loading]: isVisualizationLoading,
                [classes.empty]: !dataSourceId,
            })}
        >
            {dataSourceId && !isVisualizationLoading && (
                <div className={classes.container} data-test="update-buttons">
                    <EventButton />
                    <EnrollmentButton />
                    {visualizationType === 'PIVOT_TABLE' ? (
                        <CustomValueButton />
                    ) : (
                        <TrackedEntityInstanceButton />
                    )}
                </div>
            )}
        </div>
    )
}
