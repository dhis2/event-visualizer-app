import i18n from '@dhis2/d2-i18n'
import { useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import cx from 'classnames'
import { type FC } from 'react'
import { CustomValueButton } from './action-buttons/custom-value-button'
import { EnrollmentButton } from './action-buttons/enrollment-button'
import { EventButton } from './action-buttons/event-button'
import { TrackedEntityInstanceButton } from './action-buttons/tracked-entity-instance-button'
import classes from './styles/bottom-bar.module.css'
import { useHasUnappliedChanges } from './use-has-unapplied-changes'

export const BottomBar: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const hasUnappliedChanges = useHasUnappliedChanges()

    return (
        <div
            className={cx(classes.bottomBar, {
                [classes.loading]: isVisualizationLoading,
                [classes.empty]: !dataSourceId,
            })}
        >
            {dataSourceId && !isVisualizationLoading && (
                <div className={classes.container} data-test="update-buttons">
                    {visualizationType === 'PIVOT_TABLE' ? (
                        <>
                            <EnrollmentButton />
                            <EventButton />
                            <CustomValueButton />
                        </>
                    ) : (
                        <>
                            <TrackedEntityInstanceButton />
                            <EnrollmentButton />
                            <EventButton />
                        </>
                    )}
                    {hasUnappliedChanges && (
                        <span
                            className={classes.unappliedChanges}
                            role="status"
                            aria-live="polite"
                            data-test="unapplied-changes"
                        >
                            {i18n.t('Unapplied changes')}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
