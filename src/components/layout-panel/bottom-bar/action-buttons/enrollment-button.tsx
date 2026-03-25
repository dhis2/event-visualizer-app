import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import { BaseButtonWithConditionalTooltip } from './base-button'
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

        return i18n.t('Enrollment')
    }, [dataSourceMetadata])

    const buttonLabelLookup = useMemo(
        () => ({
            create: {
                list: i18n.t('Create {{enrollmentLabel}} list', {
                    enrollmentLabel,
                }),
                table: i18n.t('Create {{enrollmentLabel}} table', {
                    enrollmentLabel,
                }),
            },
            switch: {
                list: i18n.t('Switch to {{enrollmentLabel}} list', {
                    enrollmentLabel,
                }),
                table: i18n.t('Switch to {{enrollmentLabel}} table', {
                    enrollmentLabel,
                }),
            },
            update: {
                list: i18n.t('Update {{enrollmentLabel}} list', {
                    enrollmentLabel,
                }),
                table: i18n.t('Update {{enrollmentLabel}} table', {
                    enrollmentLabel,
                }),
            },
        }),
        [enrollmentLabel]
    )

    return (
        <BaseButtonWithConditionalTooltip
            action={action}
            disabled={Boolean(tooltipConfig)}
            label={
                buttonLabelLookup[action][
                    visualizationType === 'PIVOT_TABLE' ? 'table' : 'list'
                ]
            }
            tooltipConfig={tooltipConfig}
            type="ENROLLMENT"
        />
    )
}
