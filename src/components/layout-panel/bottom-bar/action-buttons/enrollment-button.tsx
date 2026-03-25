import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import { ActionButtonWithConditionalTooltip } from './action-button'
import { useActionButton } from './use-action-button'
import { useAppSelector } from '@hooks'
import { isDataSourceProgramWithRegistration } from '@modules/data-source'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'

export const EnrollmentButton: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)

    const { action, dataSourceMetadata, tooltipConfig } =
        useActionButton('ENROLLMENT')

    const enrollmentLabel = useMemo(() => {
        if (
            isDataSourceProgramWithRegistration(dataSourceMetadata) &&
            dataSourceMetadata.displayEnrollmentLabel
        ) {
            return dataSourceMetadata.displayEnrollmentLabel
        }

        return 'Enrollment'
    }, [dataSourceMetadata])

    const buttonLabel = useMemo(() => {
        const visualizationMedium =
            visualizationType === 'PIVOT_TABLE' ? 'table' : 'list'

        switch (action) {
            case 'create':
                return i18n.t(
                    `Create ${enrollmentLabel} ${visualizationMedium}`
                )
            case 'switch':
                return i18n.t(
                    `Switch to ${enrollmentLabel} ${visualizationMedium}`
                )
            case 'update':
            default:
                return i18n.t(
                    `Update ${enrollmentLabel} ${visualizationMedium}`
                )
        }
    }, [action, enrollmentLabel, visualizationType])

    return (
        <ActionButtonWithConditionalTooltip
            action={action}
            disabled={Boolean(tooltipConfig)}
            label={buttonLabel}
            tooltipConfig={tooltipConfig}
            type="ENROLLMENT"
        />
    )
}
